/* eslint-disable no-unused-vars */
// Get rid of flow errors caused by jasmine
type jasmineFn = (desc: string, fn: Function) => any;
declare var it: jasmineFn;
declare var describe: jasmineFn;
declare var expect: Function;
