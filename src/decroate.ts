export function stamp(target: any, name?: string, descriptor?: PropertyDescriptor): PropertyDescriptor | any {
  if (target instanceof Function) {
    target.prototype.operateStamp = Date.now();
  } else {
    const fn = descriptor.value;
    descriptor.value = function() {
      this.operateStamp = Date.now();
      fn.apply(this, arguments);
    }
    return descriptor
  }
}
