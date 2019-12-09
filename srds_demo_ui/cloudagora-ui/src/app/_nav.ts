interface NavAttributes {
  [propName: string]: any;
}
interface NavWrapper {
  attributes: NavAttributes;
  element: string;
}
interface NavBadge {
  text: string;
  variant: string;
}
interface NavLabel {
  class?: string;
  variant: string;
}

export interface NavData {
  name?: string;
  url?: string;
  icon?: string;
  badge?: NavBadge;
  title?: boolean;
  children?: NavData[];
  variant?: string;
  attributes?: NavAttributes;
  divider?: boolean;
  class?: string;
  label?: NavLabel;
  wrapper?: NavWrapper;
}

export const navItems: NavData[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    icon: 'icon-speedometer',
  },
  {
    name: 'Auctions',
    url: '/auctions',
    icon: 'icon-list',
   },
   {
    name: 'Wallet',
    url: '/wallet',
    icon: 'icon-calculator',
  },
  {
    name: 'Registry',
    url: '/registry',
    icon: 'icon-list',
  },
  {
    name: 'Settings',
    url: '/settings',
    icon: 'icon-settings',
  },
  {
    divider: true
  },
];
