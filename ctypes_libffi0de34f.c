
#include <caml/mlvalues.h>
#include <ffi.h>

CAMLprim value ffi_test()
{
  ffi_prep_closure(NULL, NULL, NULL, NULL);
  return Val_unit;
}
