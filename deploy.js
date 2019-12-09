
let argv = require('minimist')(process.argv.slice(2));

let host = argv.host || 'http://localhost:7545'

const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider(host))
// const web3 = new Web3(new Web3.providers.WebsocketProvider(host))
const fs = require('fs')
const getNetwork = async () => {
    let id = await web3.eth.net.getId()
    if (id == 5) return "goerli"
    else return await web3.eth.net.getNetworkType()
}

const base = './build/'

function getArtifacts(name) {
    return {
        abi: JSON.parse(fs.readFileSync(base + name + '.abi')),
        bin: fs.readFileSync(base + name + '.bin')
    }
}

async function deployContract(name, options = {}, args = []) {
    let artifacts = getArtifacts(name)
    let contract = new web3.eth.Contract(artifacts.abi)
    let res = await contract.deploy({ data: "0x" + artifacts.bin, arguments: args }).send(options)
    res.abi = artifacts.abi
    return res
}

function exportContract(contract) {
    // console.log(contract.abi)
    return {
        address: contract.options.address,
        abi: contract.abi
    }
}

async function deploy() {
    let networkName = await getNetwork(web3)
    let filename = './wasm-client/' + networkName + '.json'
    console.log("Writing to", filename)

    let accounts = await web3.eth.getAccounts()

    //    console.log("bg limit", await web3.eth.getBlock(1))

    //////////////  deploy Truebit contracts ///////////////
    let ipfsRegister = await deployContract('IpfsRegister', { from: accounts[0], gas: 5500000 })
    console.log("IPFS Register", ipfsRegister.options.address)

    let fileSystem = await deployContract('Filesystem', { from: accounts[0], gas: 5500000 })
    console.log("Filesystem", fileSystem.options.address)
    let judge = await deployContract('Judge', { from: accounts[0], gas: 5600000 })
    console.log("Judge", judge.options.address)

    let interactive = await deployContract('Interactive', { from: accounts[0], gas: 5500000 }, [judge.options.address])
    console.log("Interactive", interactive.options.address)

    let tru = await deployContract('TRU', { from: accounts[0], gas: 2000000 })
    let exchangeRateOracle = await deployContract('ExchangeRateOracle', { from: accounts[0], gas: 1000000 })
    console.log("TRU", tru.options.address)

    let incentiveLayer = await deployContract(
        'IncentiveLayer',
        { from: accounts[0], gas: 5200000 },
        [tru.options.address,
        exchangeRateOracle.options.address,
        interactive.options.address,
        fileSystem.options.address,
        ]
    )
    console.log("Incentive Layer", incentiveLayer.options.address)

    //////////////  deploy Cloudagora contracts ///////////////
    let contractsRegistry = await deployContract('ContractsRegistry', {from: accounts[0], gas: 2000000});
    console.log("ContractsRegistry", contractsRegistry.options.address);

    let auctionFactory = await deployContract('AuctionFactory', {from: accounts[0], gas: 5500000},[contractsRegistry.options.address]);
    console.log("AuctionFactory", auctionFactory.options.address);

    let usersRegistry = await deployContract('UsersRegistry', {from: accounts[0], gas: 2000000});
    console.log("UsersRegistry", usersRegistry.options.address);

    // let storageProofLibrary = await deployContract('StorageProof', {from: accounts[0], gas: 2000000});
    // console.log("StorageProofLibrary", storageProofLibrary.options.address);

    ////////TODO: remove later //////////////
    /*
    let oldStorageName = '/truebit/contracts_old/StorageSupply';
    let oldStorageCode = {
	    abi: JSON.parse(fs.readFileSync(oldStorageName+'.abi')),
	    bin: fs.readFileSync(oldStorageName+'.bin')
    }
    let oldStorageContract = new web3.eth.Contract(oldStorageCode.abi)
    let oldStorageRes = await oldStorageContract.deploy({ data: "0x" + oldStorageCode.bin, arguments: ['0x28203Fa04ea082a2d455a77cB19428eba4Ef5e51','0x28203Fa04ea082a2d455a77cB19428eba4Ef5e51',1000,10000,100] }).send({from: accounts[0], gas: 2000000, value:1000})
    oldStorageRes.abi = oldStorageCode.abi
    console.log('StorageSupply', oldStorageRes.options.address)
    */
    ////////TODO: remove later //////////////

    // tru.methods.transferOwnership(incentiveLayer._address).send({from: accounts[0], gas: 1000000})

    let wait = 0
    if (networkName == "kovan") wait = 10000
    else if (networkName == "rinkeby") wait = 15000
    else if (networkName == "goerli") wait = 15000
    else if (networkName == "ropsten") wait = 30000

    let config = {
        WAIT_TIME: wait,
        fileSystem: exportContract(fileSystem),
        judge: exportContract(judge),
        interactive: exportContract(interactive),
        tru: exportContract(tru),
        exchangeRateOracle: exportContract(exchangeRateOracle),
        incentiveLayer: exportContract(incentiveLayer),
        ipfsRegister: exportContract(ipfsRegister),
	contractsRegistry: exportContract(contractsRegistry),
	auctionFactory: exportContract(auctionFactory),
	usersRegistry: exportContract(usersRegistry),
	// storageProofLibrary: exportContract(storageProofLibrary)
    }

    if (networkName == "private") {
        let whitelist = await deployContract('WhiteList', { from: accounts[0], gas: 2000000 })
        let stake_whitelist = await deployContract('StakeWhitelist', { from: accounts[0], gas: 2000000 })
        let testbook = await deployContract('TestBook', { from: accounts[0], gas: 2000000 })

        let ss_incentiveLayer = await deployContract(
            'SingleSolverIncentiveLayer',
            { from: accounts[0], gas: 5200000 },
            [interactive.options.address, fileSystem.options.address, whitelist.options.address]
        )

        await web3.eth.sendTransaction({ from: accounts[0], to: ss_incentiveLayer.options.address, value: web3.utils.toWei("2", "ether") })

        await stake_whitelist.methods.setToken(tru.options.address).send({ from: accounts[0], gas: 300000 })
        await stake_whitelist.methods.setTaskBook(testbook.options.address).send({ from: accounts[0], gas: 300000 })

        config.ss_incentiveLayer = exportContract(ss_incentiveLayer)
        config.stake_whitelist = exportContract(stake_whitelist)
        config.testbook = exportContract(testbook)

        // Mint tokens for testing
        accounts.forEach(async addr => {
            await web3.eth.sendTransaction({ from: accounts[0], to: addr, value: web3.utils.toWei("2", "ether") })
            await tru.methods.addMinter(addr).send({ from: accounts[0], gas: 300000 })
            await tru.methods.mint(addr, "100000000000000000000000").send({ from: addr, gas: 300000 })
        })
    }

    fs.writeFileSync(filename, JSON.stringify(config))

    // Set exchange rate oracle for testing, main net should come from external data source (dex, oraclize, etc..)
    // const TRUperUSD = 2000
    const TRUperUSD = 0
    await exchangeRateOracle.methods.updateExchangeRate(TRUperUSD).send({ from: accounts[0] })

    if (networkName != "ethereum") {
        tru.methods.enableFaucet().send({ from: accounts[0], gas: 300000 })
    }

}

deploy()
