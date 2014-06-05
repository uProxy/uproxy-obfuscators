// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    window['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?\{ ?[^}]* ?\}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    var source = Pointer_stringify(code);
    if (source[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (source.indexOf('"', 1) === source.length-1) {
        source = source.substr(1, source.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + source + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    try {
      var evalled = eval('(function(' + args.join(',') + '){ ' + source + ' })'); // new Function does not allow upvars in node
    } catch(e) {
      Module.printErr('error in executing inline EM_ASM code: ' + e + ' on: \n\n' + source + '\n\nwith args |' + args + '| (make sure to use the right one out of EM_ASM, EM_ASM_ARGS, etc.)');
      throw e;
    }
    return Runtime.asmConstCache[code] = evalled;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      /* TODO: use TextEncoder when present,
        var encoder = new TextEncoder();
        encoder['encoding'] = "utf-8";
        var utf8Array = encoder['encode'](aMsg.data);
      */
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===
var __ZTVN10__cxxabiv117__class_type_infoE = 35600;
var __ZTVN10__cxxabiv120__si_class_type_infoE = 35640;




STATIC_BASE = 8;

STATICTOP = STATIC_BASE + Runtime.alignMemory(36467);
/* global initializers */ __ATINIT__.push({ func: function() { __GLOBAL__I_a() } });


/* memory initializer */ allocate([0,0,0,0,184,0,0,0,1,0,0,0,2,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,112,108,97,105,110,116,101,120,116,95,100,102,97,0,0,0,112,108,97,105,110,116,101,120,116,95,109,97,120,95,108,101,110,0,0,0,0,0,0,0,99,105,112,104,101,114,116,101,120,116,95,100,102,97,0,0,99,105,112,104,101,114,116,101,120,116,95,109,97,120,95,108,101,110,0,0,0,0,0,0,49,52,70,116,101,84,114,97,110,115,102,111,114,109,101,114,0,0,0,0,0,0,0,0,49,49,84,114,97,110,115,102,111,114,109,101,114,0,0,0,24,139,0,0,160,0,0,0,64,139,0,0,136,0,0,0,176,0,0,0,0,0,0,0,102,108,97,103,115,95,32,38,32,107,73,110,116,70,108,97,103,0,0,0,0,0,0,0,116,104,105,114,100,95,112,97,114,116,121,47,114,97,112,105,100,106,115,111,110,47,105,110,99,108,117,100,101,47,114,97,112,105,100,106,115,111,110,47,100,111,99,117,109,101,110,116,46,104,0,0,0,0,0,0,71,101,116,73,110,116,0,0,73,115,83,116,114,105,110,103,40,41,0,0,0,0,0,0,71,101,116,83,116,114,105,110,103,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,110,97,109,101,0,0,0,0,70,105,110,100,77,101,109,98,101,114,0,0,0,0,0,0,73,115,79,98,106,101,99,116,40,41,0,0,0,0,0,0,115,116,97,99,107,95,46,71,101,116,83,105,122,101,40,41,32,61,61,32,115,105,122,101,111,102,40,86,97,108,117,101,84,121,112,101,41,0,0,0,80,97,114,115,101,83,116,114,101,97,109,0,0,0,0,0,71,101,116,83,105,122,101,40,41,32,62,61,32,99,111,117,110,116,32,42,32,115,105,122,101,111,102,40,84,41,0,0,116,104,105,114,100,95,112,97,114,116,121,47,114,97,112,105,100,106,115,111,110,47,105,110,99,108,117,100,101,47,114,97,112,105,100,106,115,111,110,47,105,110,116,101,114,110,97,108,47,115,116,97,99,107,46,104,0,0,0,0,0,0,0,0,80,111,112,0,0,0,0,0,84,101,120,116,32,111,110,108,121,32,99,111,110,116,97,105,110,115,32,119,104,105,116,101,32,115,112,97,99,101,40,115,41,0,0,0,0,0,0,0,69,120,112,101,99,116,32,101,105,116,104,101,114,32,97,110,32,111,98,106,101,99,116,32,111,114,32,97,114,114,97,121,32,97,116,32,114,111,111,116,0,0,0,0,0,0,0,0,78,111,116,104,105,110,103,32,115,104,111,117,108,100,32,102,111,108,108,111,119,32,116,104,101,32,114,111,111,116,32,111,98,106,101,99,116,32,111,114,32,97,114,114,97,121,46,0,115,116,114,101,97,109,46,80,101,101,107,40,41,32,61,61,32,39,91,39,0,0,0,0,116,104,105,114,100,95,112,97,114,116,121,47,114,97,112,105,100,106,115,111,110,47,105,110,99,108,117,100,101,47,114,97,112,105,100,106,115,111,110,47,114,101,97,100,101,114,46,104,0,0,0,0,0,0,0,0,80,97,114,115,101,65,114,114,97,121,0,0,0,0,0,0,77,117,115,116,32,98,101,32,97,32,99,111,109,109,97,32,111,114,32,39,93,39,32,97,102,116,101,114,32,97,110,32,97,114,114,97,121,32,101,108,101,109,101,110,116,46,0,0,69,120,112,101,99,116,32,97,32,118,97,108,117,101,32,104,101,114,101,46,0,0,0,0,78,117,109,98,101,114,32,116,111,111,32,98,105,103,32,116,111,32,115,116,111,114,101,32,105,110,32,100,111,117,98,108,101,0,0,0,0,0,0,0,65,116,32,108,101,97,115,116,32,111,110,101,32,100,105,103,105,116,32,105,110,32,102,114,97,99,116,105,111,110,32,112,97,114,116,0,0,0,0,0,65,116,32,108,101,97,115,116,32,111,110,101,32,100,105,103,105,116,32,105,110,32,101,120,112,111,110,101,110,116,0,0,40,40,117,105,110,116,112,116,114,95,116,41,111,114,105,103,105,110,97,108,80,116,114,32,38,32,51,41,32,61,61,32,48,0,0,0,0,0,0,0,116,104,105,114,100,95,112,97,114,116,121,47,114,97,112,105,100,106,115,111,110,47,105,110,99,108,117,100,101,47,114,97,112,105,100,106,115,111,110,47,114,97,112,105,100,106,115,111,110,46,104,0,0,0,0,0,82,101,97,108,108,111,99,0,110,101,119,66,117,102,102,101,114,32,33,61,32,48,0,0,40,40,117,105,110,116,112,116,114,95,116,41,98,117,102,102,101,114,32,38,32,51,41,32,61,61,32,48,0,0,0,0,77,97,108,108,111,99,0,0,210,232,25,120,214,48,7,0,13,198,64,44,24,250,49,0,145,247,80,55,158,120,102,0,117,53,37,197,197,22,156,0,105,65,55,155,59,142,209,0,195,17,5,130,202,241,5,1,52,86,134,34,61,110,59,1,225,245,147,53,230,36,113,1,89,243,248,194,31,110,165,1,47,48,183,179,167,201,218,1,29,126,82,208,8,190,16,2,165,29,103,4,139,237,68,2,14,229,128,197,237,40,122,2,41,143,112,155,148,89,176,2,243,178,76,194,249,111,228,2,176,223,223,50,248,139,25,3,156,215,151,63,246,238,79,3,193,230,190,231,89,245,131,3,114,160,174,97,176,242,184,3,142,72,26,122,92,47,239,3,89,109,80,204,153,125,35,4,175,136,100,63,0,93,88,4,219,170,61,79,64,116,142,4,201,138,134,49,168,8,195,4,123,45,232,61,210,202,247,4,217,56,98,205,134,189,45,5,136,99,93,64,116,150,98,5,106,188,116,80,17,60,151,5,132,235,145,164,21,11,205,5,51,51,219,134,237,38,2,6,255,255,145,232,168,176,54,6,255,127,182,34,211,92,108,6,0,16,178,245,3,186,161,6,255,147,30,243,132,40,214,6,255,56,230,47,166,178,11,7,160,227,239,221,167,79,65,7,135,220,107,213,145,163,117,7,169,211,198,74,118,12,171,7,74,68,188,238,201,231,224,7,92,85,107,106,188,33,21,8,179,42,6,133,43,106,74,8,176,218,35,51,91,130,128,8,92,209,236,255,241,162,180,8,179,5,232,127,174,203,233,8,144,3,241,15,77,31,32,9,116,68,237,83,32,39,84,9,145,149,232,104,232,48,137,9,245,186,34,131,34,125,191,9,217,180,245,145,53,174,243,9,16,34,115,246,194,153,40,10,147,234,15,180,51,192,94,10,156,242,137,80,32,56,147,10,67,111,172,100,40,6,200,10,20,139,215,125,178,7,254,10,236,182,166,142,207,196,50,11,168,100,80,114,3,118,103,11,209,125,228,78,132,83,157,11,163,206,78,177,50,84,210,11,76,130,162,93,63,233,6,12,223,34,11,53,143,163,60,12,203,245,38,129,57,230,113,12,62,179,112,225,199,95,166,12,13,224,204,217,185,247,219,12,8,12,32,40,212,122,17,13,10,15,40,50,137,217,69,13,205,18,178,126,235,79,123,13,192,75,47,47,243,17,177,13,176,30,251,250,111,86,229,13,92,230,185,249,11,172,26,14,250,47,20,124,135,171,80,14,248,59,25,91,105,214,132,14,246,138,223,177,3,12,186,14,218,182,43,79,130,71,240,14,144,164,246,226,98,89,36,15,180,77,180,155,187,111,89,15,33,97,161,130,170,203,143,15,181,220,164,145,74,223,195,15,226,19,14,54,29,215,248,15,219,152,145,131,228,12,47,16,137,255,58,210,14,104,99,16,107,191,201,134,18,66,152,16,69,47,124,40,151,82,206,16,139,157,77,121,158,243,2,17,238,4,161,23,134,176,55,17,42,70,137,157,167,156,109,17,218,203,117,194,232,129,162,17,209,62,19,243,98,34,215,17,133,14,216,175,251,234,12,18,19,9,231,77,221,18,66,18,88,203,96,161,148,151,118,18,46,254,184,201,121,61,172,18,221,158,19,30,108,166,225,18,148,134,152,37,7,16,22,19,57,168,254,238,8,148,75,19,35,41,95,149,133,60,129,19,108,243,182,250,166,139,181,19,71,176,100,185,144,238,234,19,45,238,222,115,26,213,32,20,184,169,214,16,97,10,85,20,38,84,12,85,249,76,138,20,152,180,39,213,27,112,192,20,189,161,113,202,34,140,244,20,45,10,14,125,43,175,41,21,92,198,40,46,123,13,96,21,243,247,178,249,217,16,148,21,240,181,31,120,16,21,201,21,108,163,39,150,84,90,255,21,35,198,216,221,116,152,51,22,172,247,78,21,146,126,104,22,151,181,162,154,54,158,158,22,126,177,165,32,226,34,211,22,222,29,207,168,154,235,7,23,86,229,2,83,129,230,61,23,86,207,225,211,16,176,114,23,43,67,218,8,21,92,167,23,246,211,16,75,26,51,221,23,122,132,234,110,240,63,18,24,152,37,165,138,236,207,70,24,254,110,78,173,231,131,124,24,95,5,81,204,112,210,177,24,182,70,101,255,12,71,230,24,100,152,62,63,208,216,27,25,62,31,135,39,130,103,81,25,14,231,104,177,98,193,133,25,210,32,195,93,187,49,187,25,131,244,153,26,21,255,240,25,164,113,64,97,218,62,37,26,13,142,144,249,144,142,90,26,200,88,250,155,26,153,144,26,250,238,248,66,97,191,196,26,184,42,183,147,57,239,249,26,179,122,82,252,131,53,48,27,96,25,103,251,228,66,100,27,184,223,64,58,158,83,153,27,166,23,209,200,133,168,207,27,200,174,130,157,83,201,3,28,122,90,227,132,168,187,56,28,24,49,28,166,146,234,110,28,175,158,209,167,155,82,163,28,91,6,198,145,66,39,216,28,242,135,55,54,19,49,14,29,247,180,226,1,172,222,66,29,53,98,91,2,87,150,119,29,194,58,242,194,236,123,173,29,185,100,215,249,115,109,226,29,231,61,77,248,208,8,23,30,97,141,96,54,5,203,76,30,93,88,252,65,227,254,129,30,116,110,123,18,156,126,182,30,17,74,26,23,67,30,236,30,75,110,112,238,233,146,33,31,221,137,12,106,164,247,85,31,85,172,143,132,141,117,139,31,181,203,217,114,120,41,193,31,162,62,144,143,214,115,245,31,75,78,116,51,204,208,42,32,239,176,40,160,127,194,96,32,42,221,50,136,31,243,148,32,117,148,63,106,231,47,202,32,201,188,103,162,240,93,0,33,251,171,1,203,108,117,52,33,250,22,194,253,199,146,105,33,185,156,50,253,121,247,159,33,243,161,63,62,172,250,211,33,112,138,207,77,87,249,8,34,12,109,67,33,173,55,63,34,40,36,202,52,204,130,115,34,50,173,252,65,127,99,168,34,126,216,123,18,95,124,222,34,79,103,141,107,187,13,19,35,35,193,112,70,42,209,71,35,107,241,12,216,116,197,125,35,227,22,8,7,105,155,178,35,156,28,202,72,67,66,231,35,195,163,252,26,212,18,29,36,90,230,221,144,196,43,82,36,240,95,21,181,181,182,134,36,236,183,90,34,99,100,188,36,244,178,120,245,189,190,241,36,176,223,214,114,109,46,38,37,157,151,140,207,8,186,91,37,194,222,183,129,69,84,145,37,114,214,37,226,86,169,197,37,15,76,175,154,172,19,251,37,137,143,173,224,75,236,48,38,108,243,216,216,94,39,101,38,71,48,15,143,54,113,154,38,44,126,105,25,194,134,208,38,183,221,195,159,114,168,4,39,37,213,180,71,143,210,57,39,55,5,209,140,153,35,112,39,133,70,5,240,127,44,164,39,38,152,6,236,159,55,217,39,48,62,8,231,135,133,15,40,222,38,101,240,116,179,67,40,149,112,126,44,82,160,120,40,186,12,158,183,102,200,174,40,245,199,194,50,64,61,227,40,242,121,115,63,144,12,24,41,110,88,80,79,180,15,78,41,69,55,146,177,208,201,130,41,22,197,246,221,68,124,183,41,91,118,116,21,86,91,237,41,249,201,104,205,21,89,34,42,119,252,194,64,91,239,86,42,149,187,243,16,50,171,140,42,61,85,152,74,255,234,193,42,141,106,62,29,191,101,246,42,48,5,142,228,46,255,43,43,62,195,216,78,125,127,97,43,13,244,142,162,92,223,149,43,17,177,50,203,51,87,203,43,170,174,255,94,128,22,1,44,85,154,191,118,32,92,53,44,234,128,111,148,40,179,106,44,146,176,197,92,249,175,160,44,183,28,247,179,247,219,212,44,229,227,244,160,245,18,10,45,111,14,153,132,217,75,64,45,11,82,191,229,207,94,116,45,141,38,47,223,131,118,169,45,49,240,250,214,36,212,223,45,31,214,92,6,151,228,19,46,166,11,244,199,188,221,72,46,144,14,241,249,43,21,127,46,26,169,54,124,59,109,179,46,96,83,68,91,138,72,232,46,56,104,21,242,172,90,30,47,35,97,77,23,172,248,82,47,108,185,32,29,215,182,135,47,199,231,104,228,140,164,189,47,220,144,193,14,216,134,242,47,19,245,113,18,142,40,39,48,88,114,14,151,177,242,92,48,119,7,105,254,174,23,146,48,85,73,3,190,154,157,198,48,170,27,132,109,1,69,252,48,74,145,114,228,32,171,49,49,157,53,143,29,233,21,102,49,4,3,243,100,99,155,155,49,227,225,23,31,30,65,209,49,91,218,221,166,101,145,5,50,242,80,149,16,191,245,58,50,151,82,93,106,151,217,112,50,61,167,244,68,253,15,165,50,13,209,49,150,252,83,218,50,168,34,223,221,125,116,16,51,82,235,86,85,157,145,68,51,38,166,172,170,4,182,121,51,216,231,171,234,194,17,176,51,206,225,86,165,51,22,228,51,65,154,172,142,192,27,25,52,210,192,87,178,176,98,79,52,131,216,118,111,174,157,131,52,164,142,84,11,26,133,184,52,77,178,41,142,96,166,238,52,112,15,218,88,252,39,35,53,76,147,16,111,251,241,87,53,31,184,212,74,122,238,141,53,19,243,196,110,12,181,194,53,216,47,118,138,79,98,247,53,206,187,19,109,227,58,45,54,97,85,44,36,206,68,98,54,185,106,55,173,1,214,150,54,103,69,133,24,130,139,204,54,97,75,83,79,49,215,1,55,57,30,40,163,253,76,54,55,199,37,242,11,61,224,107,55,156,87,119,39,38,108,161,55,131,45,85,177,47,199,213,55,228,120,170,157,251,56,11,56,143,139,138,66,157,3,65,56,114,46,45,147,132,68,117,56,15,122,248,183,165,149,170,56,73,76,251,146,135,157,224,56,92,31,186,119,233,196,20,57,51,167,168,213,35,246,73,57,128,104,137,101,214,57,128,57,160,194,235,254,75,72,180,57,71,179,166,254,94,90,233,57,25,96,80,190,246,176,31,58,16,60,242,54,154,206,83,58,20,203,174,196,64,194,136,58,217,125,218,245,208,242,190,58,167,142,168,153,194,87,243,58,81,178,18,64,179,45,40,59,230,94,23,16,32,57,94,59,79,155,14,10,180,227,146,59,35,66,146,12,161,156,199,59,172,210,182,79,201,131,253,59,172,67,210,209,93,114,50,60,151,212,70,70,245,14,103,60,188,137,216,151,178,210,156,60,22,86,231,158,175,3,210,60,155,43,161,134,155,132,6,61,130,118,73,104,194,37,60,61,17,234,45,129,153,151,113,61,149,100,121,225,127,253,165,61,187,189,215,217,223,124,219,61,149,214,38,232,11,46,17,62,58,140,48,226,142,121,69,62,72,175,188,154,242,215,122,62,141,237,181,160,247,198,176,62,241,104,227,136,181,248,228,62,45,67,28,235,226,54,26,63,252,169,241,210,77,98,80,63,123,20,174,71,225,122,132,63,154,153,153,153,153,153,185,63,0,0,0,0,0,0,240,63,0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,64,143,64,0,0,0,0,0,136,195,64,0,0,0,0,0,106,248,64,0,0,0,0,128,132,46,65,0,0,0,0,208,18,99,65,0,0,0,0,132,215,151,65,0,0,0,0,101,205,205,65,0,0,0,32,95,160,2,66,0,0,0,232,118,72,55,66,0,0,0,162,148,26,109,66,0,0,64,229,156,48,162,66,0,0,144,30,196,188,214,66,0,0,52,38,245,107,12,67,0,128,224,55,121,195,65,67,0,160,216,133,87,52,118,67,0,200,78,103,109,193,171,67,0,61,145,96,228,88,225,67,64,140,181,120,29,175,21,68,80,239,226,214,228,26,75,68,146,213,77,6,207,240,128,68,246,74,225,199,2,45,181,68,180,157,217,121,67,120,234,68,145,2,40,44,42,139,32,69,53,3,50,183,244,173,84,69,2,132,254,228,113,217,137,69,129,18,31,47,231,39,192,69,33,215,230,250,224,49,244,69,234,140,160,57,89,62,41,70,36,176,8,136,239,141,95,70,23,110,5,181,181,184,147,70,156,201,70,34,227,166,200,70,3,124,216,234,155,208,254,70,130,77,199,114,97,66,51,71,227,32,121,207,249,18,104,71,27,105,87,67,184,23,158,71,177,161,22,42,211,206,210,71,29,74,156,244,135,130,7,72,165,92,195,241,41,99,61,72,231,25,26,55,250,93,114,72,97,160,224,196,120,245,166,72,121,200,24,246,214,178,220,72,76,125,207,89,198,239,17,73,158,92,67,240,183,107,70,73,198,51,84,236,165,6,124,73,92,160,180,179,39,132,177,73,115,200,161,160,49,229,229,73,143,58,202,8,126,94,27,74,154,100,126,197,14,27,81,74,192,253,221,118,210,97,133,74,48,125,149,20,71,186,186,74,62,110,221,108,108,180,240,74,206,201,20,136,135,225,36,75,65,252,25,106,233,25,90,75,169,61,80,226,49,80,144,75,19,77,228,90,62,100,196,75,87,96,157,241,77,125,249,75,109,184,4,110,161,220,47,76,68,243,194,228,228,233,99,76,21,176,243,29,94,228,152,76,27,156,112,165,117,29,207,76,145,97,102,135,105,114,3,77,245,249,63,233,3,79,56,77,114,248,143,227,196,98,110,77,71,251,57,14,187,253,162,77,25,122,200,209,41,189,215,77,159,152,58,70,116,172,13,78,100,159,228,171,200,139,66,78,61,199,221,214,186,46,119,78,12,57,149,140,105,250,172,78,167,67,221,247,129,28,226,78,145,148,212,117,162,163,22,79,181,185,73,19,139,76,76,79,17,20,14,236,214,175,129,79,22,153,17,167,204,27,182,79,91,255,213,208,191,162,235,79,153,191,133,226,183,69,33,80,127,47,39,219,37,151,85,80,95,251,240,81,239,252,138,80,27,157,54,147,21,222,192,80,98,68,4,248,154,21,245,80,123,85,5,182,1,91,42,81,109,85,195,17,225,120,96,81,200,42,52,86,25,151,148,81,122,53,193,171,223,188,201,81,108,193,88,203,11,22,0,82,199,241,46,190,142,27,52,82,57,174,186,109,114,34,105,82,199,89,41,9,15,107,159,82,29,216,185,101,233,162,211,82,36,78,40,191,163,139,8,83,173,97,242,174,140,174,62,83,12,125,87,237,23,45,115,83,79,92,173,232,93,248,167,83,99,179,216,98,117,246,221,83,30,112,199,93,9,186,18,84,37,76,57,181,139,104,71,84,46,159,135,162,174,66,125,84,125,195,148,37,173,73,178,84,92,244,249,110,24,220,230,84,115,113,184,138,30,147,28,85,232,70,179,22,243,219,81,85,162,24,96,220,239,82,134,85,202,30,120,211,171,231,187,85,63,19,43,100,203,112,241,85,14,216,53,61,254,204,37,86,18,78,131,204,61,64,91,86,203,16,210,159,38,8,145,86,254,148,198,71,48,74,197,86,61,58,184,89,188,156,250,86,102,36,19,184,245,161,48,87,128,237,23,38,115,202,100,87,224,232,157,239,15,253,153,87,140,177,194,245,41,62,208,87,239,93,51,115,180,77,4,88,107,53,0,144,33,97,57,88,197,66,0,244,105,185,111,88,187,41,128,56,226,211,163,88,42,52,160,198,218,200,216,88,53,65,72,120,17,251,14,89,193,40,45,235,234,92,67,89,241,114,248,165,37,52,120,89,173,143,118,15,47,65,174,89,204,25,170,105,189,232,226,89,63,160,20,196,236,162,23,90,79,200,25,245,167,139,77,90,50,29,48,249,72,119,130,90,126,36,124,55,27,21,183,90,158,45,91,5,98,218,236,90,130,252,88,67,125,8,34,91,163,59,47,148,156,138,86,91,140,10,59,185,67,45,140,91,151,230,196,83,74,156,193,91,61,32,182,232,92,3,246,91,77,168,227,34,52,132,43,92,48,73,206,149,160,50,97,92,124,219,65,187,72,127,149,92,91,82,18,234,26,223,202,92,121,115,75,210,112,203,0,93,87,80,222,6,77,254,52,93,109,228,149,72,224,61,106,93,196,174,93,45,172,102,160,93,117,26,181,56,87,128,212,93,18,97,226,6,109,160,9,94,171,124,77,36,68,4,64,94,214,219,96,45,85,5,116,94,204,18,185,120,170,6,169,94,127,87,231,22,85,72,223,94,175,150,80,46,53,141,19,95,91,188,228,121,130,112,72,95,114,235,93,24,163,140,126,95,39,179,58,239,229,23,179,95,241,95,9,107,223,221,231,95,237,183,203,69,87,213,29,96,244,82,159,139,86,165,82,96,177,39,135,46,172,78,135,96,157,241,40,58,87,34,189,96,2,151,89,132,118,53,242,96,195,252,111,37,212,194,38,97,244,251,203,46,137,115,92,97,120,125,63,189,53,200,145,97,214,92,143,44,67,58,198,97,12,52,179,247,211,200,251,97,135,0,208,122,132,93,49,98,169,0,132,153,229,180,101,98,212,0,229,255,30,34,155,98,132,32,239,95,83,245,208,98,165,232,234,55,168,50,5,99,207,162,229,69,82,127,58,99,193,133,175,107,147,143,112,99,50,103,155,70,120,179,164,99,254,64,66,88,86,224,217,99,159,104,41,247,53,44,16,100,198,194,243,116,67,55,68,100,120,179,48,82,20,69,121,100,86,224,188,102,89,150,175,100,54,12,54,224,247,189,227,100,67,143,67,216,117,173,24,101,20,115,84,78,211,216,78,101,236,199,244,16,132,71,131,101,232,249,49,21,101,25,184,101,97,120,126,90,190,31,238,101,61,11,143,248,214,211,34,102,12,206,178,182,204,136,87,102,143,129,95,228,255,106,141,102,249,176,187,238,223,98,194,102,56,157,106,234,151,251,246,102,134,68,5,229,125,186,44,103,212,74,35,175,142,244,97,103,137,29,236,90,178,113,150,103,235,36,167,241,30,14,204,103,19,119,8,87,211,136,1,104,215,148,202,44,8,235,53,104,13,58,253,55,202,101,107,104,72,68,254,98,158,31,161,104,90,213,189,251,133,103,213,104,177,74,173,122,103,193,10,105,175,78,172,172,224,184,64,105,90,98,215,215,24,231,116,105,241,58,205,13,223,32,170,105,214,68,160,104,139,84,224,105,12,86,200,66,174,105,20,106,143,107,122,211,25,132,73,106,115,6,89,72,32,229,127,106,8,164,55,45,52,239,179,106,10,141,133,56,1,235,232,106,76,240,166,134,193,37,31,107,48,86,40,244,152,119,83,107,187,107,50,49,127,85,136,107,170,6,127,253,222,106,190,107,42,100,111,94,203,2,243,107,53,61,11,54,126,195,39,108,130,12,142,195,93,180,93,108,209,199,56,154,186,144,146,108,198,249,198,64,233,52,199,108,55,184,248,144,35,2,253,108,35,115,155,58,86,33,50,109,235,79,66,201,171,169,102,109,230,227,146,187,22,84,156,109,112,206,59,53,142,180,209,109,12,194,138,194,177,33,6,110,143,114,45,51,30,170,59,110,153,103,252,223,82,74,113,110,127,129,251,151,231,156,165,110,223,97,250,125,33,4,219,110,44,125,188,238,148,226,16,111,118,156,107,42,58,27,69,111,148,131,6,181,8,98,122,111,61,18,36,113,69,125,176,111,204,22,109,205,150,156,228,111,127,92,200,128,188,195,25,112,207,57,125,208,85,26,80,112,67,136,156,68,235,32,132,112,84,170,195,21,38,41,185,112,233,148,52,155,111,115,239,112,17,221,0,193,37,168,35,113,86,20,65,49,47,146,88,113,107,89,145,253,186,182,142,113,227,215,122,222,52,50,195,113,220,141,25,22,194,254,247,113,83,241,159,155,114,254,45,114,212,246,67,161,7,191,98,114,137,244,148,137,201,110,151,114,171,49,250,235,123,74,205,114,11,95,124,115,141,78,2,115,205,118,91,208,48,226,54,115,129,84,114,4,189,154,108,115,208,116,199,34,182,224,161,115,4,82,121,171,227,88,214,115,134,166,87,150,28,239,11,116,20,200,246,221,113,117,65,116,24,122,116,85,206,210,117,116,158,152,209,234,129,71,171,116,99,255,194,50,177,12,225,116,60,191,115,127,221,79,21,117,11,175,80,223,212,163,74,117,103,109,146,11,101,166,128,117,192,8,119,78,254,207,180,117,241,202,20,226,253,3,234,117,214,254,76,173,126,66,32,118,140,62,160,88,30,83,84,118,47,78,200,238,229,103,137,118,187,97,122,106,223,193,191,118,21,125,140,162,43,217,243,118,90,156,47,139,118,207,40,119,112,131,251,45,84,3,95,119,38,50,189,156,20,98,147,119,176,126,236,195,153,58,200,119,92,158,231,52,64,73,254,119,249,194,16,33,200,237,50,120,184,243,84,41,58,169,103,120,165,48,170,179,136,147,157,120,103,94,74,112,53,124,210,120,1,246,92,204,66,27,7,121,130,51,116,127,19,226,60,121,49,160,168,47,76,13,114,121,61,200,146,59,159,144,166,121,77,122,119,10,199,52,220,121,112,172,138,102,252,160,17,122,140,87,45,128,59,9,70,122,111,173,56,96,138,139,123,122,101,108,35,124,54,55,177,122,127,71,44,27,4,133,229,122,94,89,247,33,69,230,26,123,219,151,58,53,235,207,80,123,210,61,137,2,230,3,133,123,70,141,43,131,223,68,186,123,76,56,251,177,11,107,240,123,95,6,122,158,206,133,36,124,246,135,24,70,66,167,89,124,250,84,207,107,137,8,144,124,56,42,195,198,171,10,196,124,199,244,115,184,86,13,249,124,248,241,144,102,172,80,47,125,59,151,26,192,107,146,99,125,10,61,33,176,6,119,152,125,76,140,41,92,200,148,206,125,176,247,153,57,253,28,3,126,156,117,0,136,60,228,55,126,3,147,0,170,75,221,109,126,226,91,64,74,79,170,162,126,218,114,208,28,227,84,215,126,144,143,4,228,27,42,13,127,186,217,130,110,81,58,66,127,41,144,35,202,229,200,118,127,51,116,172,60,31,123,172,127,160,200,235,133,243,204,225,127,110,32,60,61,32,51,48,56,0,0,0,0,0,0,0,0,116,104,105,114,100,95,112,97,114,116,121,47,114,97,112,105,100,106,115,111,110,47,105,110,99,108,117,100,101,47,114,97,112,105,100,106,115,111,110,47,105,110,116,101,114,110,97,108,47,112,111,119,49,48,46,104,0,0,0,0,0,0,0,0,80,111,119,49,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,34,0,0,0,0,0,0,0,0,0,0,0,0,47,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,92,0,0,0,0,0,8,0,0,0,12,0,0,0,0,0,0,0,10,0,0,0,13,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,115,46,80,101,101,107,40,41,32,61,61,32,39,92,34,39,0,0,0,0,0,0,0,0,80,97,114,115,101,83,116,114,105,110,103,0,0,0,0,0,77,105,115,115,105,110,103,32,116,104,101,32,115,101,99,111,110,100,32,92,117,32,105,110,32,115,117,114,114,111,103,97,116,101,32,112,97,105,114,0,84,104,101,32,115,101,99,111,110,100,32,92,117,32,105,110,32,115,117,114,114,111,103,97,116,101,32,112,97,105,114,32,105,115,32,105,110,118,97,108,105,100,0,0,0,0,0,0,85,110,107,110,111,119,110,32,101,115,99,97,112,101,32,99,104,97,114,97,99,116,101,114,0,0,0,0,0,0,0,0,108,97,99,107,115,32,101,110,100,105,110,103,32,113,117,111,116,97,116,105,111,110,32,98,101,102,111,114,101,32,116,104,101,32,101,110,100,32,111,102,32,115,116,114,105,110,103,0,73,110,99,111,114,114,101,99,116,32,117,110,101,115,99,97,112,101,100,32,99,104,97,114,97,99,116,101,114,32,105,110,32,115,116,114,105,110,103,0,115,32,33,61,32,48,76,0,71,101,110,101,114,105,99,86,97,108,117,101,0,0,0,0,83,101,116,83,116,114,105,110,103,82,97,119,0,0,0,0,99,111,100,101,112,111,105,110,116,32,60,61,32,48,120,49,48,70,70,70,70,0,0,0,69,110,99,111,100,101,0,0,73,110,99,111,114,114,101,99,116,32,104,101,120,32,100,105,103,105,116,32,97,102,116,101,114,32,92,117,32,101,115,99,97,112,101,0,0,0,0,0,115,116,114,101,97,109,46,80,101,101,107,40,41,32,61,61,32,39,102,39,0,0,0,0,80,97,114,115,101,70,97,108,115,101,0,0,0,0,0,0,73,110,118,97,108,105,100,32,118,97,108,117,101,0,0,0,115,116,114,101,97,109,46,80,101,101,107,40,41,32,61,61,32,39,116,39,0,0,0,0,80,97,114,115,101,84,114,117,101,0,0,0,0,0,0,0,115,116,114,101,97,109,46,80,101,101,107,40,41,32,61,61,32,39,110,39,0,0,0,0,80,97,114,115,101,78,117,108,108,0,0,0,0,0,0,0,71,101,116,83,105,122,101,40,41,32,62,61,32,115,105,122,101,111,102,40,84,41,0,0,84,111,112,0,0,0,0,0,115,116,114,101,97,109,46,80,101,101,107,40,41,32,61,61,32,39,123,39,0,0,0,0,80,97,114,115,101,79,98,106,101,99,116,0,0,0,0,0,78,97,109,101,32,111,102,32,97,110,32,111,98,106,101,99,116,32,109,101,109,98,101,114,32,109,117,115,116,32,98,101,32,97,32,115,116,114,105,110,103,0,0,0,0,0,0,0,84,104,101,114,101,32,109,117,115,116,32,98,101,32,97,32,99,111,108,111,110,32,97,102,116,101,114,32,116,104,101,32,110,97,109,101,32,111,102,32,111,98,106,101,99,116,32,109,101,109,98,101,114,0,0,0,77,117,115,116,32,98,101,32,97,32,99,111,109,109,97,32,111,114,32,39,125,39,32,97,102,116,101,114,32,97,110,32,111,98,106,101,99,116,32,109,101,109,98,101,114,0,0,0,115,116,97,99,107,95,99,97,112,97,99,105,116,121,95,32,62,32,48,0,0,0,0,0,83,116,97,99,107,0,0,0,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,115,58,0,0,0,0,0,37,100,58,32,0,0,0,0,71,78,85,32,77,80,32,97,115,115,101,114,116,105,111,110,32,102,97,105,108,101,100,58,32,37,115,10,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,71,78,85,32,77,80,58,32,67,97,110,110,111,116,32,97,108,108,111,99,97,116,101,32,109,101,109,111,114,121,32,40,115,105,122,101,61,37,108,117,41,10,0,0,0,0,0,0,71,78,85,32,77,80,58,32,67,97,110,110,111,116,32,114,101,97,108,108,111,99,97,116,101,32,109,101,109,111,114,121,32,40,111,108,100,95,115,105,122,101,61,37,108,117,32,110,101,119,95,115,105,122,101,61,37,108,117,41,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,3,4,4,4,4,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,1,2,3,4,5,6,7,8,9,255,255,255,255,255,255,255,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,255,255,255,255,255,255,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,1,2,3,4,5,6,7,8,9,255,255,255,255,255,255,255,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,255,255,255,255,255,255,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,1,171,205,183,57,163,197,239,241,27,61,167,41,19,53,223,225,139,173,151,25,131,165,207,209,251,29,135,9,243,21,191,193,107,141,119,249,99,133,175,177,219,253,103,233,211,245,159,161,75,109,87,217,67,101,143,145,187,221,71,201,179,213,127,129,43,77,55,185,35,69,111,113,155,189,39,169,147,181,95,97,11,45,23,153,3,37,79,81,123,157,7,137,115,149,63,65,235,13,247,121,227,5,47,49,91,125,231,105,83,117,31,33,203,237,215,89,195,229,15,17,59,93,199,73,51,85,255,103,109,112,58,32,111,118,101,114,102,108,111,119,32,105,110,32,109,112,122,32,116,121,112,101,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,255,255,255,255,255,255,255,31,1,0,0,0,0,0,0,0,20,0,0,0,193,156,132,161,71,3,184,50,145,27,212,207,36,60,86,59,16,0,0,0,255,255,255,127,255,255,255,63,2,0,0,0,0,0,0,0,13,0,0,0,164,209,64,110,37,60,77,74,149,115,194,72,132,38,92,194,12,0,0,0,27,201,8,99,71,3,184,82,0,16,191,129,182,209,27,249,11,0,0,0,235,100,48,91,253,217,213,89,151,156,219,117,203,162,7,22,10,0,0,0,85,85,85,85,255,255,255,95,3,0,0,0,0,0,0,0,10,0,0,0,96,78,194,80,142,6,112,101,145,27,212,207,36,60,86,59,9,0,0,0,66,77,16,77,37,60,77,106,0,202,154,59,130,190,224,18,9,0,0,0,7,39,0,74,240,169,179,110,43,109,139,140,4,222,76,210,8,0,0,0,13,206,104,71,71,3,184,114,0,0,161,25,181,154,163,63,8,0,0,0,227,83,46,69,142,0,106,118,33,16,159,48,95,172,248,80,8,0,0,0,251,255,60,67,253,217,213,121,0,193,246,87,30,59,132,116,8,0,0,0,17,119,134,65,109,63,5,125,129,155,194,152,194,38,3,173,8,0,0,0,255,255,255,63,255,255,255,127,4,0,0,0,0,0,0,0,7,0,0,0,253,106,161,62,223,126,204,130,113,69,117,24,189,182,240,78,7,0,0,0,141,89,100,61,142,6,112,133,128,188,125,36,161,72,252,192,7,0,0,0,48,194,67,60,174,5,239,135,123,102,71,53,66,137,131,51,7,0,0,0,66,154,59,59,37,60,77,138,0,64,75,76,171,41,127,173,7,0,0,0,240,152,72,58,68,221,141,140,29,110,90,107,21,61,60,49,7,0,0,0,19,11,104,57,240,169,179,142,128,225,172,148,224,169,204,184,7,0,0,0,183,178,151,56,0,5,193,144,103,131,241,202,233,109,237,66,6,0,0,0,209,174,213,55,71,3,184,146,0,0,100,11,11,14,152,103,6,0,0,0,210,104,32,55,75,120,154,148,81,74,141,14,18,152,121,25,6,0,0,0,126,134,118,54,142,0,106,150,64,174,105,18,150,83,232,188,6,0,0,0,235,222,214,53,213,9,40,152,73,145,23,23,169,3,193,98,6,0,0,0,214,113,64,53,253,217,213,153,0,16,185,28,67,61,53,29,6,0,0,0,197,96,178,52,143,148,116,155,153,72,116,35,234,236,29,206,6,0,0,0,134,233,43,52,109,63,5,157,64,168,115,43,17,197,15,121,6,0,0,0,185,97,172,51,179,198,136,158,65,59,230,52,160,101,184,53,6,0,0,0,51,51,51,51,255,255,255,159,5,0,0,0,0,0,0,0,6,0,0,0,1,217,191,50,55,173,107,161,193,60,250,76,179,209,174,169,6,0,0,0,246,220,81,50,223,126,204,162,64,216,19,92,41,194,223,99,6,0,0,0,159,213,232,49,35,22,35,164,25,181,145,109,48,238,15,43,6,0,0,0,141,100,132,49,142,6,112,165,0,16,191,129,182,209,27,249,6,0,0,0,232,52,36,49,139,215,179,166,201,224,237,152,169,195,137,172,6,0,0,0,52,250,199,48,174,5,239,167,64,62,119,179,254,50,44,109,6,0,0,0,76,111,111,48,213,3,34,169,209,196,187,209,201,7,121,56,6,0,0,0,127,85,26,48,37,60,77,170,0,0,36,244,11,122,111,12,5,0,0,0,209,115,200,47,230,16,113,171,73,211,231,6,84,129,146,40,5,0,0,0,82,150,121,47,68,221,141,172,160,48,202,7,157,98,232,6,5,0,0,0,143,141,45,47,251,245,163,173,187,43,195,8,160,220,115,211,5,0,0,0,22,46,228,46,240,169,179,174,0,108,212,9,149,120,177,160,5,0,0,0,9,80,157,46,180,66,189,175,253,172,255,10,165,17,104,116,5,0,0,0,192,206,88,46,0,5,193,176,224,190,70,12,15,80,166,77,5,0,0,0,116,136,22,46,30,49,191,177,239,134,171,13,130,53,162,43,5,0,0,0,247,93,214,45,71,3,184,178,0,0,48,15,136,10,178,13,5,0,0,0,117,50,152,45,250,179,171,179,241,58,214,16,228,92,141,230,5,0,0,0,56,235,91,45,75,120,154,180,32,95,160,18,157,253,205,183,5,0,0,0,121,111,33,45,38,130,132,181,227,170,144,20,51,57,88,142,5,0,0,0,46,168,232,44,142,0,106,182,0,116,169,22,234,195,124,105,5,0,0,0,234,127,177,44,214,31,75,183,37,40,237,24,108,202,165,72,5,0,0,0,176,226,123,44,213,9,40,184,96,77,94,27,22,219,82,43,5,0,0,0,219,189,71,44,21,230,0,185,151,130,255,29,166,134,21,17,5,0,0,0,252,255,20,44,253,217,213,185,0,128,211,32,54,43,29,243,5,0,0,0,195,152,227,43,245,8,167,186,153,23,221,35,25,109,215,200,5,0,0,0,231,120,179,43,143,148,116,187,160,53,31,39,180,30,203,162,5,0,0,0,16,146,132,43,162,156,62,188,11,225,156,42,195,62,124,128,5,0,0,0,199,214,86,43,109,63,5,189,0,60,89,46,191,200,126,97,5,0,0,0,96,58,42,43,171,153,200,189,77,132,87,50,190,108,116,69,5,0,0,0,241,176,254,42,179,198,136,190,224,19,155,54,115,162,10,44,5,0,0,0,60,47,212,42,139,224,69,191,63,97,39,59,5,8,249,20,5,0,0,0,170,170,170,42,255,255,255,191,6,0,0,0,0,0,0,0,5,0,0,0,58,25,130,42,180,60,183,192,65,161,40,69,41,8,207,217,5,0,0,0,118,113,90,42,55,173,107,193,32,20,165,74,65,72,252,182,5,0,0,0,110,170,51,42,19,103,29,194,51,70,121,80,203,84,48,151,5,0,0,0,170,187,13,42,223,126,204,194,0,68,169,86,75,190,29,122,5,0,0,0,36,157,232,41,72,8,121,195,117,57,57,93,127,205,127,95,5,0,0,0,64,71,196,41,35,22,35,196,96,114,45,100,132,108,25,71,5,0,0,0,199,178,160,41,120,186,202,196,231,90,138,107,53,54,180,48,5,0,0,0,219,216,125,41,142,6,112,197,0,128,84,115,246,165,31,28,5,0,0,0,249,178,91,41,244,10,19,198,233,143,144,123,74,99,48,9,5,0,0,0,235,58,58,41,139,215,179,198,160,90,67,132,60,74,127,239,5,0,0,0,204,106,25,41,147,123,82,199,91,210,113,141,210,82,85,207,5,0,0,0,251,60,249,40,174,5,239,199,0,12,33,151,142,124,164,177,5,0,0,0,27,172,217,40,237,131,137,200,157,63,86,161,62,180,52,150,5,0,0,0,16,179,186,40,213,3,34,201,224,200,22,172,125,129,211,124,5,0,0,0,248,76,156,40,103,146,184,201,143,39,104,183,97,103,83,101,5,0,0,0,41,117,126,40,37,60,77,202,0,0,80,195,142,88,139,79,5,0,0,0,48,39,97,40,28,13,224,202,145,27,212,207,36,60,86,59,5,0,0,0,201,94,68,40,230,16,113,203,32,105,250,220,84,129,146,40,5,0,0,0,225,23,40,40,177,82,0,204,131,253,200,234,176,191,33,23,5,0,0,0,144,78,12,40,68,221,141,204,0,20,70,249,157,98,232,6,4,0,0,0,27,255,240,39,5,187,25,205,177,132,28,3,124,193,28,73,4,0,0,0,236,37,214,39,251,245,163,205,16,171,66,3,59,216,17,58,4,0,0,0,149,191,187,39,214,151,44,206,33,44,106,3,205,116,224,43,4,0,0,0,200,200,161,39,240,169,179,206,0,16,147,3,231,2,122,30,4,0,0,0,94,62,136,39,80,53,57,207,225,94,189,3,221,14,209,17,4,0,0,0,76,29,111,39,180,66,189,207,16,33,233,3,104,44,217,5,4,0,0,0,168,98,86,39,139,218,63,208,241,94,22,4,178,191,13,245,4,0,0,0,163,11,62,39,0,5,193,208,0,33,69,4,22,19,159,223,4,0,0,0,140,21,38,39,250,201,64,209,209,111,117,4,132,166,82,203,4,0,0,0,201,125,14,39,30,49,191,209,16,84,167,4,151,62,22,184,4,0,0,0,221,65,247,38,212,65,60,210,129,214,218,4,105,242,216,165,4,0,0,0,95,95,224,38,71,3,184,210,0,0,16,5,205,15,139,148,4,0,0,0,254,211,201,38,106,124,50,211,129,217,70,5,21,2,30,132,4,0,0,0,127,157,179,38,250,179,171,211,16,108,127,5,30,59,132,116,4,0,0,0,188,185,157,38,126,176,35,212], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([209,192,185,5,110,30,177,101,4,0,0,0,161,38,136,38,75,120,154,212,0,225,245,5,35,238,152,87,4,0,0,0,45,226,114,38,135,17,16,213,241,213,51,6,155,185,48,74,4,0,0,0,114,234,93,38,38,130,132,213,16,169,115,6,148,77,110,61,4,0,0,0,147,61,73,38,244,207,247,213,225,99,181,6,176,37,72,49,4,0,0,0,194,217,52,38,142,0,106,214,0,16,249,6,46,95,181,37,4,0,0,0,65,189,32,38,106,25,219,214,33,183,62,7,203,172,173,26,4,0,0,0,98,230,12,38,214,31,75,215,16,99,134,7,162,75,41,16,4,0,0,0,133,83,249,37,249,24,186,215,177,29,208,7,246,248,32,6,4,0,0,0,22,3,230,37,213,9,40,216,0,241,27,8,182,209,27,249,4,0,0,0,144,243,210,37,75,247,148,216,17,231,105,8,42,123,211,230,4,0,0,0,121,35,192,37,21,230,0,217,16,10,186,8,110,255,92,213,4,0,0,0,101,145,173,37,210,218,107,217,65,100,12,9,178,45,173,196,4,0,0,0,243,59,155,37,253,217,213,217,0,0,97,9,207,133,185,180,4,0,0,0,203,33,137,37,243,231,62,218,193,231,183,9,239,43,120,165,4,0,0,0,162,65,119,37,245,8,167,218,16,38,17,10,42,221,223,150,4,0,0,0,55,154,101,37,38,65,14,219,145,197,108,10,9,229,231,136,4,0,0,0,80,42,84,37,143,148,116,219,0,209,202,10,211,19,136,123,4,0,0,0,194,240,66,37,28,7,218,219,49,83,43,11,149,181,184,110,4,0,0,0,100,236,49,37,162,156,62,220,16,87,142,11,219,137,114,98,4,0,0,0,28,28,33,37,220,88,162,220,161,231,243,11,7,188,174,86,4,0,0,0,213,126,16,37,109,63,5,221,0,16,92,12,51,220,102,75,4,0,0,0,131,19,0,37,224,83,103,221,97,219,198,12,163,216,148,64,4,0,0,0,33,217,239,36,171,153,200,221,16,85,52,13,165,247,50,54,4,0,0,0,179,206,223,36,46,20,41,222,113,136,164,13,240,209,59,44,4,0,0,0,67,243,207,36,179,198,136,222,0,129,23,14,95,77,170,34,4,0,0,0,225,69,192,36,113,180,231,222,81,74,141,14,18,152,121,25,4,0,0,0,166,197,176,36,139,224,69,223,16,240,5,15,229,35,165,16,4,0,0,0,176,113,161,36,17,78,163,223,1,126,129,15,55,162,40,8,4,0,0,0,36,73,146,36,255,255,255,223,7,0,0,0,0,0,0,0,4,0,0,0,44,75,131,36,66,249,91,224,1,130,129,16,82,196,78,240,4,0,0,0,249,118,116,36,180,60,183,224,16,16,6,17,74,68,54,225,4,0,0,0,192,203,101,36,29,205,17,225,81,182,141,17,137,149,175,210,4,0,0,0,188,72,87,36,55,173,107,225,0,129,24,18,131,42,180,196,4,0,0,0,47,237,72,36,171,223,196,225,113,124,166,18,245,204,61,183,4,0,0,0,93,184,58,36,19,103,29,226,16,181,55,19,197,152,70,170,4,0,0,0,146,169,44,36,251,69,117,226,97,55,204,19,41,247,200,157,4,0,0,0,27,192,30,36,223,126,204,226,0,16,100,20,48,154,191,145,4,0,0,0,77,251,16,36,45,20,35,227,161,75,255,20,135,120,37,134,4,0,0,0,128,90,3,36,72,8,121,227,16,247,157,21,140,201,245,122,4,0,0,0,16,221,245,35,130,93,206,227,49,31,64,22,160,1,44,112,4,0,0,0,93,130,232,35,35,22,35,228,0,209,229,22,177,206,195,101,4,0,0,0,204,73,219,35,101,52,119,228,145,25,143,23,2,21,185,91,4,0,0,0,196,50,206,35,120,186,202,228,16,6,60,24,35,236,7,82,4,0,0,0,179,60,193,35,126,170,29,229,193,163,236,24,25,156,172,72,4,0,0,0,6,103,180,35,142,6,112,229,0,0,161,25,181,154,163,63,4,0,0,0,50,177,167,35,181,208,193,229,65,40,89,26,18,137,233,54,4,0,0,0,172,26,155,35,244,10,19,230,16,42,21,27,64,49,123,46,4,0,0,0,239,162,142,35,65,183,99,230,17,19,213,27,11,132,85,38,4,0,0,0,118,73,130,35,139,215,179,230,0,241,152,28,234,150,117,30,4,0,0,0,195,13,118,35,179,109,3,231,177,209,96,29,13,162,216,22,4,0,0,0,88,239,105,35,147,123,82,231,16,195,44,30,135,254,123,15,4,0,0,0,187,237,93,35,249,2,161,231,33,211,252,30,146,36,93,8,4,0,0,0,116,8,82,35,174,5,239,231,0,16,209,31,244,169,121,1,4,0,0,0,16,63,70,35,109,133,60,232,225,135,169,32,235,128,158,245,4,0,0,0,27,145,58,35,237,131,137,232,16,73,134,33,219,104,183,232,4,0,0,0,38,254,46,35,217,2,214,232,241,97,103,34,213,214,57,220,4,0,0,0,198,133,35,35,213,3,34,233,0,225,76,35,209,197,33,208,4,0,0,0,142,39,24,35,126,136,109,233,209,212,54,36,55,94,107,196,4,0,0,0,24,227,12,35,103,146,184,233,16,76,37,37,156,243,18,185,4,0,0,0,253,183,1,35,29,35,3,234,129,85,24,38,148,2,21,174,4,0,0,0,217,165,246,34,37,60,77,234,0,0,16,39,177,46,110,163,4,0,0,0,76,172,235,34,254,222,150,234,129,90,12,40,148,64,27,153,4,0,0,0,246,202,224,34,28,13,224,234,16,116,13,41,30,36,25,143,4,0,0,0,121,1,214,34,242,199,40,235,209,91,19,42,183,230,100,133,4,0,0,0,122,79,203,34,230,16,113,235,0,33,30,43,180,181,251,123,4,0,0,0,161,180,192,34,93,233,184,235,241,210,45,44,200,220,218,114,4,0,0,0,149,48,182,34,177,82,0,236,16,129,66,45,152,196,255,105,4,0,0,0,0,195,171,34,57,78,71,236,225,58,92,46,84,241,103,97,4,0,0,0,144,107,161,34,68,221,141,236,0,16,123,47,110,1,17,89,4,0,0,0,241,41,151,34,28,1,212,236,33,16,159,48,95,172,248,80,4,0,0,0,212,253,140,34,5,187,25,237,16,75,200,49,124,193,28,73,4,0,0,0,233,230,130,34,60,12,95,237,177,208,246,50,216,38,123,65,4,0,0,0,227,228,120,34,251,245,163,237,0,177,42,52,59,216,17,58,4,0,0,0,119,247,110,34,116,121,232,237,17,252,99,53,34,230,222,50,4,0,0,0,90,30,101,34,214,151,44,238,16,194,162,54,205,116,224,43,4,0,0,0,68,89,91,34,73,82,112,238,65,19,231,55,88,187,20,37,4,0,0,0,238,167,81,34,240,169,179,238,0,0,49,57,231,2,122,30,4,0,0,0,17,10,72,34,234,159,246,238,193,152,128,58,208,165,14,24,4,0,0,0,105,127,62,34,80,53,57,239,16,238,213,59,221,14,209,17,4,0,0,0,180,7,53,34,57,107,123,239,145,16,49,61,142,184,191,11,4,0,0,0,175,162,43,34,180,66,189,239,0,17,146,62,104,44,217,5,4,0,0,0,25,80,34,34,205,188,254,239,49,0,249,63,76,2,28,0,4,0,0,0,180,15,25,34,139,218,63,240,16,239,101,65,178,191,13,245,4,0,0,0,65,225,15,34,242,156,128,240,161,238,216,66,163,239,48,234,4,0,0,0,131,196,6,34,0,5,193,240,0,16,82,68,22,19,159,223,4,0,0,0,63,185,253,33,177,19,1,241,97,100,209,69,201,192,85,213,4,0,0,0,58,191,244,33,250,201,64,241,16,253,86,71,132,166,82,203,4,0,0,0,57,214,235,33,207,40,128,241,113,235,226,72,31,136,147,193,4,0,0,0,6,254,226,33,30,49,191,241,0,65,117,74,151,62,22,184,4,0,0,0,103,54,218,33,211,227,253,241,81,15,14,76,36,183,216,174,4,0,0,0,40,127,209,33,212,65,60,242,16,104,173,77,105,242,216,165,4,0,0,0,17,216,200,33,5,76,122,242,1,93,83,79,157,3,21,157,4,0,0,0,239,64,192,33,71,3,184,242,0,0,0,81,205,15,139,148,4,0,0,0,143,185,183,33,117,104,245,242,1,99,179,82,29,77,57,140,4,0,0,0,188,65,175,33,106,124,50,243,16,152,109,84,21,2,30,132,4,0,0,0,71,217,166,33,251,63,111,243,81,177,46,86,248,132,55,124,4,0,0,0,253,127,158,33,250,179,171,243,0,193,246,87,30,59,132,116,4,0,0,0,175,53,150,33,55,217,231,243,113,217,197,89,93,152,2,109,4,0,0,0,46,250,141,33,126,176,35,244,16,13,156,91,110,30,177,101,4,0,0,0,76,205,133,33,152,58,95,244,97,110,121,93,100,92,142,94,4,0,0,0,218,174,125,33,75,120,154,244,0,16,94,95,35,238,152,87,4,0,0,0,172,158,117,33,91,106,213,244,161,4,74,97,222,123,207,80,4,0,0,0,150,156,109,33,135,17,16,245,16,95,61,99,155,185,48,74,4,0,0,0,110,168,101,33,140,110,74,245,49,50,56,101,189,102,187,67,4,0,0,0,7,194,93,33,38,130,132,245,0,145,58,103,148,77,110,61,4,0,0,0,57,233,85,33,12,77,190,245,145,142,68,105,238,66,72,55,4,0,0,0,219,29,78,33,244,207,247,245,16,62,86,107,176,37,72,49,4,0,0,0,196,95,70,33,143,11,49,246,193,178,111,109,117,222,108,43,4,0,0,0,205,174,62,33,142,0,106,246,0,0,145,111,46,95,181,37,4,0,0,0,206,10,55,33,158,175,162,246,65,57,186,113,197,162,32,32,4,0,0,0,160,115,47,33,106,25,219,246,16,114,235,115,203,172,173,26,4,0,0,0,32,233,39,33,155,62,19,247,17,190,36,118,31,137,91,21,4,0,0,0,38,107,32,33,214,31,75,247,0,49,102,120,162,75,41,16,4,0,0,0,143,249,24,33,191,189,130,247,177,222,175,122,233,15,22,11,4,0,0,0,54,148,17,33,249,24,186,247,16,219,1,125,246,248,32,6,4,0,0,0,248,58,10,33,33,50,241,247,33,58,92,127,239,48,73,1,4,0,0,0,179,237,2,33,213,9,40,248,0,16,191,129,182,209,27,249,4,0,0,0,68,172,251,32,176,160,94,248,225,112,42,132,199,176,220,239,4,0,0,0,138,118,244,32,75,247,148,248,16,113,158,134,42,123,211,230,4,0,0,0,98,76,237,32,59,14,203,248,241,36,27,137,74,185,254,221,4,0,0,0,174,45,230,32,21,230,0,249,0,161,160,139,110,255,92,213,4,0,0,0,75,26,223,32,109,127,54,249,209,249,46,142,80,237,236,204,4,0,0,0,28,18,216,32,210,218,107,249,16,68,198,144,178,45,173,196,4,0,0,0,0,21,209,32,211,248,160,249,129,148,102,147,249,117,156,188,4,0,0,0,217,34,202,32,253,217,213,249,0,0,16,150,207,133,185,180,4,0,0,0,136,59,195,32,218,126,10,250,129,155,194,152,194,38,3,173,4,0,0,0,241,94,188,32,243,231,62,250,16,124,126,155,239,43,120,165,4,0,0,0,245,140,181,32,208,21,115,250,209,182,67,158,169,113,23,158,4,0,0,0,121,197,174,32,245,8,167,250,0,97,18,161,42,221,223,150,4,0,0,0,94,8,168,32,231,193,218,250,241,143,234,163,65,92,208,143,4,0,0,0,139,85,161,32,38,65,14,251,16,89,204,166,9,229,231,136,4,0,0,0,226,172,154,32,52,135,65,251,225,209,183,169,157,117,37,130,4,0,0,0,73,14,148,32,143,148,116,251,0,16,173,172,211,19,136,123,4,0,0,0,165,121,141,32,179,105,167,251,33,41,172,175,249,204,14,117,4,0,0,0,219,238,134,32,28,7,218,251,16,51,181,178,149,181,184,110,4,0,0,0,210,109,128,32,68,109,12,252,177,67,200,181,35,233,132,104,4,0,0,0,113,246,121,32,162,156,62,252,0,113,229,184,219,137,114,98,4,0,0,0,157,136,115,32,174,149,112,252,17,209,12,188,123,192,128,92,4,0,0,0,62,36,109,32,220,88,162,252,16,122,62,191,7,188,174,86,4,0,0,0,60,201,102,32,160,230,211,252,65,130,122,194,155,177,251,80,4,0,0,0,126,119,96,32,109,63,5,253,0,0,193,197,51,220,102,75,4,0,0,0,237,46,90,32,178,99,54,253,193,9,18,201,124,124,239,69,4,0,0,0,113,239,83,32,224,83,103,253,16,182,109,204,163,216,148,64,4,0,0,0,243,184,77,32,100,16,152,253,145,27,212,207,36,60,86,59,4,0,0,0,92,139,71,32,171,153,200,253,0,81,69,211,165,247,50,54,4,0,0,0,150,102,65,32,32,240,248,253,49,109,193,214,195,96,42,49,4,0,0,0,139,74,59,32,46,20,41,254,16,135,72,218,240,209,59,44,4,0,0,0,37,55,53,32,60,6,89,254,161,181,218,221,69,170,102,39,4,0,0,0,78,44,47,32,179,198,136,254,0,16,120,225,95,77,170,34,4,0,0,0,240,41,41,32,248,85,184,254,97,173,32,229,60,35,6,30,4,0,0,0,248,47,35,32,113,180,231,254,16,165,212,232,18,152,121,25,4,0,0,0,80,62,29,32,129,226,22,255,113,14,148,236,51,28,4,21,4,0,0,0,229,84,23,32,139,224,69,255,0,1,95,240,229,35,165,16,4,0,0,0,161,115,17,32,240,174,116,255,81,148,53,244,73,39,92,12,4,0,0,0,113,154,11,32,17,78,163,255,16,224,23,248,55,162,40,8,4,0,0,0,66,201,5,32,76,190,209,255,1,252,5,252,35,20,10,4,4,0,0,0,255,255,255,31,255,255,255,255,8,0,0,0,0,0,0,0,0,0,0,0,144,1,0,0,32,3,0,0,64,6,0,0,128,12,0,0,128,37,0,0,128,112,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,1,0,0,192,3,0,0,128,7,0,0,0,15,0,0,0,45,0,0,0,135,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,47,104,111,109,101,47,118,97,103,114,97,110,116,47,98,117,105,108,100,47,103,109,112,45,54,46,48,46,48,47,109,112,110,47,103,101,110,101,114,105,99,47,109,117,108,95,102,102,116,46,99,0,0,0,0,0,95,95,103,109,112,110,95,102,102,116,95,110,101,120,116,95,115,105,122,101,32,40,112,108,44,32,107,41,32,61,61,32,112,108,0,0,0,0,0,0,110,112,114,105,109,101,32,60,32,112,108,0,0,0,0,0,40,110,32,38,32,40,75,50,32,45,32,49,41,41,32,61,61,32,48,0,0,0,0,0,110,112,114,105,109,101,50,32,60,32,110,0,0,0,0,0,110,108,32,61,61,32,48,0,47,104,111,109,101,47,118,97,103,114,97,110,116,47,98,117,105,108,100,47,103,109,112,45,54,46,48,46,48,47,109,112,110,47,103,101,110,101,114,105,99,47,115,101,116,95,115,116,114,46,99,0,0,0,0,0,112,111,119,116,97,98,95,109,101,109,95,112,116,114,32,60,32,112,111,119,116,97,98,95,109,101,109,32,43,32,40,40,117,110,41,32,43,32,51,50,41,0,0,0,0,0,0,0,47,104,111,109,101,47,118,97,103,114,97,110,116,47,98,117,105,108,100,47,103,109,112,45,54,46,48,46,48,47,109,112,110,47,103,101,110,101,114,105,99,47,116,100,105,118,95,113,114,46,99,0,0,0,0,0,113,120,110,32,61,61,32,48,0,0,0,0,0,0,0,0,110,50,112,91,113,110,93,32,62,61,32,99,121,50,0,0,114,110,32,61,61,32,100,110,0,0,0,0,0,0,0,0,47,104,111,109,101,47,118,97,103,114,97,110,116,47,98,117,105,108,100,47,103,109,112,45,54,46,48,46,48,47,109,112,110,47,103,101,110,101,114,105,99,47,115,98,112,105,49,95,100,105,118,97,112,112,114,95,113,46,99,0,0,0,0,0,110,112,91,49,93,32,61,61,32,110,49,0,0,0,0,0,47,104,111,109,101,47,118,97,103,114,97,110,116,47,98,117,105,108,100,47,103,109,112,45,54,46,48,46,48,47,109,112,110,47,103,101,110,101,114,105,99,47,109,117,95,100,105,118,95,113,114,46,99,0,0,0,99,121,32,61,61,32,48,0,99,120,32,62,61,32,99,121,0,0,0,0,0,0,0,0,109,97,112,58,58,97,116,58,32,32,107,101,121,32,110,111,116,32,102,111,117,110,100,0,60,0,0,0,0,0,0,0,112,55,0,0,3,0,0,0,4,0,0,0,196,255,255,255,196,255,255,255,112,55,0,0,5,0,0,0,6,0,0,0,78,83,116,51,95,95,49,49,57,98,97,115,105,99,95,105,115,116,114,105,110,103,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,99,69,69,69,69,0,0,0,64,139,0,0,40,55,0,0,232,99,0,0,0,0,0,0,60,0,0,0,0,0,0,0,232,99,0,0,7,0,0,0,8,0,0,0,196,255,255,255,196,255,255,255,232,99,0,0,9,0,0,0,10,0,0,0,0,0,0,0,48,56,0,0,11,0,0,0,12,0,0,0,2,0,0,0,5,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,6,0,0,0,4,0,0,0,5,0,0,0,3,0,0,0,7,0,0,0,4,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,105,110,103,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,99,69,69,69,69,0,0,0,0,0,0,0,64,139,0,0,232,55,0,0,112,99,0,0,0,0,0,0,109,112,122,95,115,101,116,95,115,116,114,0,0,0,0,0,1,0,0,0,2,0,0,0,4,0,0,0,8,0,0,0,16,0,0,0,32,0,0,0,64,0,0,0,128,0,0,0,27,0,0,0,54,0,0,0,198,99,99,165,248,124,124,132,238,119,119,153,246,123,123,141,255,242,242,13,214,107,107,189,222,111,111,177,145,197,197,84,96,48,48,80,2,1,1,3,206,103,103,169,86,43,43,125,231,254,254,25,181,215,215,98,77,171,171,230,236,118,118,154,143,202,202,69,31,130,130,157,137,201,201,64,250,125,125,135,239,250,250,21,178,89,89,235,142,71,71,201,251,240,240,11,65,173,173,236,179,212,212,103,95,162,162,253,69,175,175,234,35,156,156,191,83,164,164,247,228,114,114,150,155,192,192,91,117,183,183,194,225,253,253,28,61,147,147,174,76,38,38,106,108,54,54,90,126,63,63,65,245,247,247,2,131,204,204,79,104,52,52,92,81,165,165,244,209,229,229,52,249,241,241,8,226,113,113,147,171,216,216,115,98,49,49,83,42,21,21,63,8,4,4,12,149,199,199,82,70,35,35,101,157,195,195,94,48,24,24,40,55,150,150,161,10,5,5,15,47,154,154,181,14,7,7,9,36,18,18,54,27,128,128,155,223,226,226,61,205,235,235,38,78,39,39,105,127,178,178,205,234,117,117,159,18,9,9,27,29,131,131,158,88,44,44,116,52,26,26,46,54,27,27,45,220,110,110,178,180,90,90,238,91,160,160,251,164,82,82,246,118,59,59,77,183,214,214,97,125,179,179,206,82,41,41,123,221,227,227,62,94,47,47,113,19,132,132,151,166,83,83,245,185,209,209,104,0,0,0,0,193,237,237,44,64,32,32,96,227,252,252,31,121,177,177,200,182,91,91,237,212,106,106,190,141,203,203,70,103,190,190,217,114,57,57,75,148,74,74,222,152,76,76,212,176,88,88,232,133,207,207,74,187,208,208,107,197,239,239,42,79,170,170,229,237,251,251,22,134,67,67,197,154,77,77,215,102,51,51,85,17,133,133,148,138,69,69,207,233,249,249,16,4,2,2,6,254,127,127,129,160,80,80,240,120,60,60,68,37,159,159,186,75,168,168,227,162,81,81,243,93,163,163,254,128,64,64,192,5,143,143,138,63,146,146,173,33,157,157,188,112,56,56,72,241,245,245,4,99,188,188,223,119,182,182,193,175,218,218,117,66,33,33,99,32,16,16,48,229,255,255,26,253,243,243,14,191,210,210,109,129,205,205,76,24,12,12,20,38,19,19,53,195,236,236,47,190,95,95,225,53,151,151,162,136,68,68,204,46,23,23,57,147,196,196,87,85,167,167,242,252,126,126,130,122,61,61,71,200,100,100,172,186,93,93,231,50,25,25,43,230,115,115,149,192,96,96,160,25,129,129,152,158,79,79,209,163,220,220,127,68,34,34,102,84,42,42,126,59,144,144,171,11,136,136,131,140,70,70,202,199,238,238,41,107,184,184,211,40,20,20,60,167,222,222,121,188,94,94,226,22,11,11,29,173,219,219,118,219,224,224,59,100,50,50,86,116,58,58,78,20,10,10,30,146,73,73,219,12,6,6,10,72,36,36,108,184,92,92,228,159,194,194,93,189,211,211,110,67,172,172,239,196,98,98,166,57,145,145,168,49,149,149,164,211,228,228,55,242,121,121,139,213,231,231,50,139,200,200,67,110,55,55,89,218,109,109,183,1,141,141,140,177,213,213,100,156,78,78,210,73,169,169,224,216,108,108,180,172,86,86,250,243,244,244,7,207,234,234,37,202,101,101,175,244,122,122,142,71,174,174,233,16,8,8,24,111,186,186,213,240,120,120,136,74,37,37,111,92,46,46,114,56,28,28,36,87,166,166,241,115,180,180,199,151,198,198,81,203,232,232,35,161,221,221,124,232,116,116,156,62,31,31,33,150,75,75,221,97,189,189,220,13,139,139,134,15,138,138,133,224,112,112,144,124,62,62,66,113,181,181,196,204,102,102,170,144,72,72,216,6,3,3,5,247,246,246,1,28,14,14,18,194,97,97,163,106,53,53,95,174,87,87,249,105,185,185,208,23,134,134,145,153,193,193,88,58,29,29,39,39,158,158,185,217,225,225,56,235,248,248,19,43,152,152,179,34,17,17,51,210,105,105,187,169,217,217,112,7,142,142,137,51,148,148,167,45,155,155,182,60,30,30,34,21,135,135,146,201,233,233,32,135,206,206,73,170,85,85,255,80,40,40,120,165,223,223,122,3,140,140,143,89,161,161,248,9,137,137,128,26,13,13,23,101,191,191,218,215,230,230,49,132,66,66,198,208,104,104,184,130,65,65,195,41,153,153,176,90,45,45,119,30,15,15,17,123,176,176,203,168,84,84,252,109,187,187,214,44,22,22,58,165,198,99,99,132,248,124,124,153,238,119,119,141,246,123,123,13,255,242,242,189,214,107,107,177,222,111,111,84,145,197,197,80,96,48,48,3,2,1,1,169,206,103,103,125,86,43,43,25,231,254,254,98,181,215,215,230,77,171,171,154,236,118,118,69,143,202,202,157,31,130,130,64,137,201,201,135,250,125,125,21,239,250,250,235,178,89,89,201,142,71,71,11,251,240,240,236,65,173,173,103,179,212,212,253,95,162,162,234,69,175,175,191,35,156,156,247,83,164,164,150,228,114,114,91,155,192,192,194,117,183,183,28,225,253,253,174,61,147,147,106,76,38,38,90,108,54,54,65,126,63,63,2,245,247,247,79,131,204,204,92,104,52,52,244,81,165,165,52,209,229,229,8,249,241,241,147,226,113,113,115,171,216,216,83,98,49,49,63,42,21,21,12,8,4,4,82,149,199,199,101,70,35,35,94,157,195,195,40,48,24,24,161,55,150,150,15,10,5,5,181,47,154,154,9,14,7,7,54,36,18,18,155,27,128,128,61,223,226,226,38,205,235,235,105,78,39,39,205,127,178,178,159,234,117,117,27,18,9,9,158,29,131,131,116,88,44,44,46,52,26,26,45,54,27,27,178,220,110,110,238,180,90,90,251,91,160,160,246,164,82,82,77,118,59,59,97,183,214,214,206,125,179,179,123,82,41,41,62,221,227,227,113,94,47,47,151,19,132,132,245,166,83,83,104,185,209,209,0,0,0,0,44,193,237,237,96,64,32,32,31,227,252,252,200,121,177,177,237,182,91,91,190,212,106,106,70,141,203,203,217,103,190,190,75,114,57,57,222,148,74,74,212,152,76,76,232,176,88,88,74,133,207,207,107,187,208,208,42,197,239,239,229,79,170,170,22,237,251,251,197,134,67,67,215,154,77,77,85,102,51,51,148,17,133,133,207,138,69,69,16,233,249,249,6,4,2,2,129,254,127,127,240,160,80,80,68,120,60,60,186,37,159,159,227,75,168,168,243,162,81,81,254,93,163,163,192,128,64,64,138,5,143,143,173,63,146,146,188,33,157,157,72,112,56,56,4,241,245,245,223,99,188,188,193,119,182,182,117,175,218,218,99,66,33,33,48,32,16,16,26,229,255,255,14,253,243,243,109,191,210,210,76,129,205,205,20,24,12,12,53,38,19,19,47,195,236,236,225,190,95,95,162,53,151,151,204,136,68,68,57,46,23,23,87,147,196,196,242,85,167,167,130,252,126,126,71,122,61,61,172,200,100,100,231,186,93,93,43,50,25,25,149,230,115,115,160,192,96,96,152,25,129,129,209,158,79,79,127,163,220,220,102,68,34,34,126,84,42,42,171,59,144,144,131,11,136,136,202,140,70,70,41,199,238,238,211,107,184,184,60,40,20,20,121,167,222,222,226,188,94,94,29,22,11,11,118,173,219,219,59,219,224,224,86,100,50,50,78,116,58,58,30,20,10,10,219,146,73,73,10,12,6,6,108,72,36,36,228,184,92,92,93,159,194,194,110,189,211,211,239,67,172,172,166,196,98,98,168,57,145,145,164,49,149,149,55,211,228,228,139,242,121,121,50,213,231,231,67,139,200,200,89,110,55,55,183,218,109,109,140,1,141,141,100,177,213,213,210,156,78,78,224,73,169,169,180,216,108,108,250,172,86,86,7,243,244,244,37,207,234,234,175,202,101,101,142,244,122,122,233,71,174,174,24,16,8,8,213,111,186,186,136,240,120,120,111,74,37,37,114,92,46,46,36,56,28,28,241,87,166,166,199,115,180,180,81,151,198,198,35,203,232,232,124,161,221,221,156,232,116,116,33,62,31,31,221,150,75,75,220,97,189,189,134,13,139,139,133,15,138,138,144,224,112,112,66,124,62,62,196,113,181,181,170,204,102,102,216,144,72,72,5,6,3,3,1,247,246,246,18,28,14,14,163,194,97,97,95,106,53,53,249,174,87,87,208,105,185,185,145,23,134,134,88,153,193,193,39,58,29,29,185,39,158,158,56,217,225,225,19,235,248,248,179,43,152,152,51,34,17,17,187,210,105,105,112,169,217,217,137,7,142,142,167,51,148,148,182,45,155,155,34,60,30,30,146,21,135,135,32,201,233,233,73,135,206,206,255,170,85,85,120,80,40,40,122,165,223,223,143,3,140,140,248,89,161,161,128,9,137,137,23,26,13,13,218,101,191,191,49,215,230,230,198,132,66,66,184,208,104,104,195,130,65,65,176,41,153,153,119,90,45,45,17,30,15,15,203,123,176,176,252,168,84,84,214,109,187,187,58,44,22,22,99,165,198,99,124,132,248,124,119,153,238,119,123,141,246,123,242,13,255,242,107,189,214,107,111,177,222,111,197,84,145,197,48,80,96,48,1,3,2,1,103,169,206,103,43,125,86,43,254,25,231,254,215,98,181,215,171,230,77,171,118,154,236,118,202,69,143,202,130,157,31,130,201,64,137,201,125,135,250,125,250,21,239,250,89,235,178,89,71,201,142,71,240,11,251,240,173,236,65,173,212,103,179,212,162,253,95,162,175,234,69,175,156,191,35,156,164,247,83,164,114,150,228,114,192,91,155,192,183,194,117,183,253,28,225,253,147,174,61,147,38,106,76,38,54,90,108,54,63,65,126,63,247,2,245,247,204,79,131,204,52,92,104,52,165,244,81,165,229,52,209,229,241,8,249,241,113,147,226,113,216,115,171,216,49,83,98,49,21,63,42,21,4,12,8,4,199,82,149,199,35,101,70,35,195,94,157,195,24,40,48,24,150,161,55,150,5,15,10,5,154,181,47,154,7,9,14,7,18,54,36,18,128,155,27,128,226,61,223,226,235,38,205,235,39,105,78,39,178,205,127,178,117,159,234,117,9,27,18,9,131,158,29,131,44,116,88,44,26,46,52,26,27,45,54,27,110,178,220,110,90,238,180,90,160,251,91,160,82,246,164,82,59,77,118,59,214,97,183,214,179,206,125,179,41,123,82,41,227,62,221,227,47,113,94,47,132,151,19,132,83,245,166,83,209,104,185,209,0,0,0,0,237,44,193,237,32,96,64,32,252,31,227,252,177,200,121,177,91,237,182,91,106,190,212,106,203,70,141,203,190,217,103,190,57,75,114,57,74,222,148,74,76,212,152,76,88,232,176,88,207,74,133,207,208,107,187,208,239,42,197,239,170,229,79,170,251,22,237,251,67,197,134,67,77,215,154,77,51,85,102,51,133,148,17,133,69,207,138,69,249,16,233,249,2,6,4,2,127,129,254,127,80,240,160,80,60,68,120,60,159,186,37,159,168,227,75,168,81,243,162,81,163,254,93,163,64,192,128,64,143,138,5,143,146,173,63,146,157,188,33,157,56,72,112,56,245,4,241,245,188,223,99,188,182,193,119,182,218,117,175,218,33,99,66,33,16,48,32,16,255,26,229,255,243,14,253,243,210,109,191,210,205,76,129,205,12,20,24,12,19,53,38,19,236,47,195,236,95,225,190,95,151,162,53,151,68,204,136,68,23,57,46,23,196,87,147,196,167,242,85,167,126,130,252,126,61,71,122,61,100,172,200,100,93,231,186,93,25,43,50,25,115,149,230,115,96,160,192,96,129,152,25,129,79,209,158,79,220,127,163,220,34,102,68,34,42,126,84,42,144,171,59,144,136,131,11,136,70,202,140,70,238,41,199,238,184,211,107,184,20,60,40,20,222,121,167,222,94,226,188,94,11,29,22,11,219,118,173,219,224,59,219,224,50,86,100,50,58,78,116,58,10,30,20,10,73,219,146,73,6,10,12,6,36,108,72,36,92,228,184,92,194,93,159,194,211,110,189,211,172,239,67,172,98,166,196,98,145,168,57,145,149,164,49,149,228,55,211,228,121,139,242,121,231,50,213,231,200,67,139,200,55,89,110,55,109,183,218,109,141,140,1,141,213,100,177,213,78,210,156,78,169,224,73,169,108,180,216,108,86,250,172,86,244,7,243,244,234,37,207,234,101,175,202,101,122,142,244,122,174,233,71,174,8,24,16,8,186,213,111,186,120,136,240,120,37,111,74,37,46,114,92,46,28,36,56,28,166,241,87,166,180,199,115,180,198,81,151,198,232,35,203,232,221,124,161,221,116,156,232,116,31,33,62,31,75,221,150,75,189,220,97,189,139,134,13,139,138,133,15,138,112,144,224,112,62,66,124,62,181,196,113,181,102,170,204,102,72,216,144,72,3,5,6,3,246,1,247,246,14,18,28,14,97,163,194,97,53,95,106,53,87,249,174,87,185,208,105,185,134,145,23,134,193,88,153,193,29,39,58,29,158,185,39,158,225,56,217,225,248,19,235,248,152,179,43,152,17,51,34,17,105,187,210,105,217,112,169,217,142,137,7,142,148,167,51,148,155,182,45,155,30,34,60,30,135,146,21,135,233,32,201,233,206,73,135,206,85,255,170,85,40,120,80,40,223,122,165,223,140,143,3,140,161,248,89,161,137,128,9,137,13,23,26,13,191,218,101,191,230,49,215,230,66,198,132,66,104,184,208,104,65,195,130,65,153,176,41,153,45,119,90,45,15,17,30,15,176,203,123,176,84,252,168,84,187,214,109,187,22,58,44,22,99,99,165,198,124,124,132,248,119,119,153,238,123,123,141,246,242,242,13,255,107,107,189,214,111,111,177,222,197,197,84,145,48,48,80,96,1,1,3,2,103,103,169,206,43,43,125,86,254,254,25,231,215,215,98,181,171,171,230,77,118,118,154,236,202,202,69,143,130,130,157,31,201,201,64,137,125,125,135,250,250,250,21,239,89,89,235,178,71,71,201,142,240,240,11,251,173,173,236,65,212,212,103,179,162,162,253,95,175,175,234,69,156,156,191,35,164,164,247,83,114,114,150,228,192,192,91,155,183,183,194,117,253,253,28,225,147,147,174,61,38,38,106,76,54,54,90,108,63,63,65,126,247,247,2,245,204,204,79,131,52,52,92,104,165,165,244,81,229,229,52,209,241,241,8,249,113,113,147,226,216,216,115,171,49,49,83,98,21,21,63,42,4,4,12,8,199,199,82,149,35,35,101,70,195,195,94,157,24,24,40,48,150,150,161,55,5,5,15,10,154,154,181,47,7,7,9,14,18,18,54,36,128,128,155,27,226,226,61,223,235,235,38,205,39,39,105,78,178,178,205,127,117,117,159,234,9,9,27,18,131,131,158,29,44,44,116,88,26,26,46,52,27,27,45,54,110,110,178,220,90,90,238,180,160,160,251,91,82,82,246,164,59,59,77,118,214,214,97,183,179,179,206,125,41,41,123,82,227,227,62,221,47,47,113,94,132,132,151,19,83,83,245,166,209,209,104,185,0,0,0,0,237,237,44,193,32,32,96,64,252,252,31,227,177,177,200,121,91,91,237,182,106,106,190,212,203,203,70,141,190,190,217,103,57,57,75,114,74,74,222,148,76,76,212,152,88,88,232,176,207,207,74,133,208,208,107,187,239,239,42,197,170,170,229,79,251,251,22,237,67,67,197,134,77,77,215,154,51,51,85,102,133,133,148,17,69,69,207,138,249,249,16,233,2,2,6,4,127,127,129,254,80,80,240,160,60,60,68,120,159,159,186,37,168,168,227,75,81,81,243,162,163,163,254,93,64,64,192,128,143,143,138,5,146,146,173,63,157,157,188,33,56,56,72,112,245,245,4,241,188,188,223,99,182,182,193,119,218,218,117,175,33,33,99,66,16,16,48,32,255,255,26,229,243,243,14,253,210,210,109,191,205,205,76,129,12,12,20,24,19,19,53,38,236,236,47,195,95,95,225,190,151,151,162,53,68,68,204,136,23,23,57,46,196,196,87,147,167,167,242,85,126,126,130,252,61,61,71,122,100,100,172,200,93,93,231,186,25,25,43,50,115,115,149,230,96,96,160,192,129,129,152,25,79,79,209,158,220,220,127,163,34,34,102,68,42,42,126,84,144,144,171,59,136,136,131,11,70,70,202,140,238,238,41,199,184,184,211,107,20,20,60,40,222,222,121,167,94,94,226,188,11,11,29,22,219,219,118,173,224,224,59,219,50,50,86,100,58,58,78,116,10,10,30,20,73,73,219,146,6,6,10,12,36,36,108,72,92,92,228,184,194,194,93,159,211,211,110,189,172,172,239,67,98,98,166,196,145,145,168,57,149,149,164,49,228,228,55,211,121,121,139,242,231,231,50,213,200,200,67,139,55,55,89,110,109,109,183,218,141,141,140,1,213,213,100,177,78,78,210,156,169,169,224,73,108,108,180,216,86,86,250,172,244,244,7,243,234,234,37,207,101,101,175,202,122,122,142,244,174,174,233,71,8,8,24,16,186,186,213,111,120,120,136,240,37,37,111,74,46,46,114,92,28,28,36,56,166,166,241,87,180,180,199,115,198,198,81,151,232,232,35,203,221,221,124,161,116,116,156,232,31,31,33,62,75,75,221,150,189,189,220,97,139,139,134,13,138,138,133,15,112,112,144,224,62,62,66,124,181,181,196,113,102,102,170,204,72,72,216,144,3,3,5,6,246,246,1,247,14,14,18,28,97,97,163,194,53,53,95,106,87,87,249,174,185,185,208,105,134,134,145,23,193,193,88,153,29,29,39,58,158,158,185,39,225,225,56,217,248,248,19,235,152,152,179,43,17,17,51,34,105,105,187,210,217,217,112,169,142,142,137,7,148,148,167,51,155,155,182,45,30,30,34,60,135,135,146,21,233,233,32,201,206,206,73,135,85,85,255,170,40,40,120,80,223,223,122,165,140,140,143,3,161,161,248,89,137,137,128,9,13,13,23,26,191,191,218,101,230,230,49,215,66,66,198,132,104,104,184,208,65,65,195,130,153,153,176,41,45,45,119,90,15,15,17,30,176,176,203,123,84,84,252,168,187,187,214,109,22,22,58,44,99,0,0,0,124,0,0,0,119,0,0,0,123,0,0,0,242,0,0,0,107,0,0,0,111,0,0,0,197,0,0,0,48,0,0,0,1,0,0,0,103,0,0,0,43,0,0,0,254,0,0,0,215,0,0,0,171,0,0,0,118,0,0,0,202,0,0,0,130,0,0,0,201,0,0,0,125,0,0,0,250,0,0,0,89,0,0,0,71,0,0,0,240,0,0,0,173,0,0,0,212,0,0,0,162,0,0,0,175,0,0,0,156,0,0,0,164,0,0,0,114,0,0,0,192,0,0,0,183,0,0,0,253,0,0,0,147,0,0,0,38,0,0,0,54,0,0,0,63,0,0,0,247,0,0,0,204,0,0,0,52,0,0,0,165,0,0,0,229,0,0,0,241,0,0,0,113,0,0,0,216,0,0,0,49,0,0,0,21,0,0,0,4,0,0,0,199,0,0,0,35,0,0,0,195,0,0,0,24,0,0,0,150,0,0,0,5,0,0,0,154,0,0,0,7,0,0,0,18,0,0,0,128,0,0,0,226,0,0,0,235,0,0,0,39,0,0,0,178,0,0,0,117,0,0,0,9,0,0,0,131,0,0,0,44,0,0,0,26,0,0,0,27,0,0,0,110,0,0,0,90,0,0,0,160,0,0,0,82,0,0,0,59,0,0,0,214,0,0,0,179,0,0,0,41,0,0,0,227,0,0,0,47,0,0,0,132,0,0,0,83,0,0,0,209,0,0,0,0,0,0,0,237,0,0,0,32,0,0,0,252,0,0,0,177,0,0,0,91,0,0,0,106,0,0,0,203,0,0,0,190,0,0,0,57,0,0,0,74,0,0,0,76,0,0,0,88,0,0,0,207,0,0,0,208,0,0,0,239,0,0,0,170,0,0,0,251,0,0,0,67,0,0,0,77,0,0,0,51,0,0,0,133,0,0,0,69,0,0,0,249,0,0,0,2,0,0,0,127,0,0,0,80,0,0,0,60,0,0,0,159,0,0,0,168,0,0,0,81,0,0,0,163,0,0,0,64,0,0,0,143,0,0,0,146,0,0,0,157,0,0,0,56,0,0,0,245,0,0,0,188,0,0,0,182,0,0,0,218,0,0,0,33,0,0,0,16,0,0,0,255,0,0,0,243,0,0,0,210,0,0,0,205,0,0,0,12,0,0,0,19,0,0,0,236,0,0,0,95,0,0,0,151,0,0,0,68,0,0,0,23,0,0,0,196,0,0,0,167,0,0,0,126,0,0,0,61,0,0,0,100,0,0,0,93,0,0,0,25,0,0,0,115,0,0,0,96,0,0,0,129,0,0,0,79,0,0,0,220,0,0,0,34,0,0,0,42,0,0,0,144,0,0,0,136,0,0,0,70,0,0,0,238,0,0,0,184,0,0,0,20,0,0,0,222,0,0,0,94,0,0,0,11,0,0,0,219,0,0,0,224,0,0,0,50,0,0,0,58,0,0,0,10,0,0,0,73,0,0,0,6,0,0,0,36,0,0,0,92,0,0,0,194,0,0,0,211,0,0,0,172,0,0,0,98,0,0,0,145,0,0,0,149,0,0,0,228,0,0,0,121,0,0,0,231,0,0,0,200,0,0,0,55,0,0,0,109,0,0,0,141,0,0,0,213,0,0,0,78,0,0,0,169,0,0,0,108,0,0,0,86,0,0,0,244,0,0,0,234,0,0,0,101,0,0,0,122,0,0,0,174,0,0,0,8,0,0,0,186,0,0,0,120,0,0,0,37,0,0,0,46,0,0,0,28,0,0,0,166,0,0,0,180,0,0,0,198,0,0,0,232,0,0,0,221,0,0,0,116,0,0,0,31,0,0,0,75,0,0,0,189,0,0,0,139,0,0,0,138,0,0,0,112,0,0,0,62,0,0,0,181,0,0,0,102,0,0,0,72,0,0,0,3,0,0,0,246,0,0,0,14,0,0,0,97,0,0,0,53,0,0,0,87,0,0,0,185,0,0,0,134,0,0,0,193,0,0,0,29,0,0,0,158,0,0,0,225,0,0,0,248,0,0,0,152,0,0,0,17,0,0,0,105,0,0,0,217,0,0,0,142,0,0,0,148,0,0,0,155,0,0,0,30,0,0,0,135,0,0,0,233,0,0,0,206,0,0,0,85,0,0,0,40,0,0,0,223,0,0,0,140,0,0,0,161,0,0,0,137,0,0,0,13,0,0,0,191,0,0,0,230,0,0,0,66,0,0,0,104,0,0,0,65,0,0,0,153,0,0,0,45,0,0,0,15,0,0,0,176,0,0,0,84,0,0,0,187,0,0,0,22,0,0,0,0,99,0,0,0,124,0,0,0,119,0,0,0,123,0,0,0,242,0,0,0,107,0,0,0,111,0,0,0,197,0,0,0,48,0,0,0,1,0,0,0,103,0,0,0,43,0,0,0,254,0,0,0,215,0,0,0,171,0,0,0,118,0,0,0,202,0,0,0,130,0,0,0,201,0,0,0,125,0,0,0,250,0,0,0,89,0,0,0,71,0,0,0,240,0,0,0,173,0,0,0,212,0,0,0,162,0,0,0,175,0,0,0,156,0,0,0,164,0,0,0,114,0,0,0,192,0,0,0,183,0,0,0,253,0,0,0,147,0,0,0,38,0,0,0,54,0,0,0,63,0,0,0,247,0,0,0,204,0,0,0,52,0,0,0,165,0,0,0,229,0,0,0,241,0,0,0,113,0,0,0,216,0,0,0,49,0,0,0,21,0,0,0,4,0,0,0,199,0,0,0,35,0,0,0,195,0,0,0,24,0,0,0,150,0,0,0,5,0,0,0,154,0,0,0,7,0,0,0,18,0,0,0,128,0,0,0,226,0,0,0,235,0,0,0,39,0,0,0,178,0,0,0,117,0,0,0,9,0,0,0,131,0,0,0,44,0,0,0,26,0,0,0,27,0,0,0,110,0,0,0,90,0,0,0,160,0,0,0,82,0,0,0,59,0,0,0,214,0,0,0,179,0,0,0,41,0,0,0,227,0,0,0,47,0,0,0,132,0,0,0,83,0,0,0,209,0,0,0,0,0,0,0,237,0,0,0,32,0,0,0,252,0,0,0,177,0,0,0,91,0,0,0,106,0,0,0,203,0,0,0,190,0,0,0,57,0,0,0,74,0,0,0,76,0,0,0,88,0,0,0,207,0,0,0,208,0,0,0,239,0,0,0,170,0,0,0,251,0,0,0,67,0,0,0,77,0,0,0,51,0,0,0,133,0,0,0,69,0,0,0,249,0,0,0,2,0,0,0,127,0,0,0,80,0,0,0,60,0,0,0,159,0,0,0,168,0,0,0,81,0,0,0,163,0,0,0,64,0,0,0,143,0,0,0,146,0,0,0,157,0,0,0,56,0,0,0,245,0,0,0,188,0,0,0,182,0,0,0,218,0,0,0,33,0,0,0,16,0,0,0,255,0,0,0,243,0,0,0,210,0,0,0,205,0,0,0,12,0,0,0,19,0,0,0,236,0,0,0,95,0,0,0,151,0,0,0,68,0,0,0,23,0,0,0,196,0,0,0,167,0,0,0,126,0,0,0,61,0,0,0,100,0,0,0,93,0,0,0,25,0,0,0,115,0,0,0,96,0,0,0,129,0,0,0,79,0,0,0,220,0,0,0,34,0,0,0,42,0,0,0,144,0,0,0,136,0,0,0,70,0,0,0,238,0,0,0,184,0,0,0,20,0,0,0,222,0,0,0,94,0,0,0,11,0,0,0,219,0,0,0,224,0,0,0,50,0,0,0,58,0,0,0,10,0,0,0,73,0,0,0,6,0,0,0,36,0,0,0,92,0,0,0,194,0,0,0,211,0,0,0,172,0,0,0,98,0,0,0,145,0,0,0,149,0,0,0,228,0,0,0,121,0,0,0,231,0,0,0,200,0,0,0,55,0,0,0,109,0,0,0,141,0,0,0,213,0,0,0,78,0,0,0,169,0,0,0,108,0,0,0,86,0,0,0,244,0,0,0,234,0,0,0,101,0,0,0,122,0,0,0,174,0,0,0,8,0,0,0,186,0,0,0,120,0,0,0,37,0,0,0,46,0,0,0,28,0,0,0,166,0,0,0,180,0,0,0,198,0,0,0,232,0,0,0,221,0,0,0,116,0,0,0,31,0,0,0,75,0,0,0,189,0,0,0,139,0,0,0,138,0,0,0,112,0,0,0,62,0,0,0,181,0,0,0,102,0,0,0,72,0,0,0,3,0,0,0,246,0,0,0,14,0,0,0,97,0,0,0,53,0,0,0,87,0,0,0,185,0,0,0,134,0,0,0,193,0,0,0,29,0,0,0,158,0,0,0,225,0,0,0,248,0,0,0,152,0,0,0,17], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10240);
/* memory initializer */ allocate([105,0,0,0,217,0,0,0,142,0,0,0,148,0,0,0,155,0,0,0,30,0,0,0,135,0,0,0,233,0,0,0,206,0,0,0,85,0,0,0,40,0,0,0,223,0,0,0,140,0,0,0,161,0,0,0,137,0,0,0,13,0,0,0,191,0,0,0,230,0,0,0,66,0,0,0,104,0,0,0,65,0,0,0,153,0,0,0,45,0,0,0,15,0,0,0,176,0,0,0,84,0,0,0,187,0,0,0,22,0,0,0,0,99,0,0,0,124,0,0,0,119,0,0,0,123,0,0,0,242,0,0,0,107,0,0,0,111,0,0,0,197,0,0,0,48,0,0,0,1,0,0,0,103,0,0,0,43,0,0,0,254,0,0,0,215,0,0,0,171,0,0,0,118,0,0,0,202,0,0,0,130,0,0,0,201,0,0,0,125,0,0,0,250,0,0,0,89,0,0,0,71,0,0,0,240,0,0,0,173,0,0,0,212,0,0,0,162,0,0,0,175,0,0,0,156,0,0,0,164,0,0,0,114,0,0,0,192,0,0,0,183,0,0,0,253,0,0,0,147,0,0,0,38,0,0,0,54,0,0,0,63,0,0,0,247,0,0,0,204,0,0,0,52,0,0,0,165,0,0,0,229,0,0,0,241,0,0,0,113,0,0,0,216,0,0,0,49,0,0,0,21,0,0,0,4,0,0,0,199,0,0,0,35,0,0,0,195,0,0,0,24,0,0,0,150,0,0,0,5,0,0,0,154,0,0,0,7,0,0,0,18,0,0,0,128,0,0,0,226,0,0,0,235,0,0,0,39,0,0,0,178,0,0,0,117,0,0,0,9,0,0,0,131,0,0,0,44,0,0,0,26,0,0,0,27,0,0,0,110,0,0,0,90,0,0,0,160,0,0,0,82,0,0,0,59,0,0,0,214,0,0,0,179,0,0,0,41,0,0,0,227,0,0,0,47,0,0,0,132,0,0,0,83,0,0,0,209,0,0,0,0,0,0,0,237,0,0,0,32,0,0,0,252,0,0,0,177,0,0,0,91,0,0,0,106,0,0,0,203,0,0,0,190,0,0,0,57,0,0,0,74,0,0,0,76,0,0,0,88,0,0,0,207,0,0,0,208,0,0,0,239,0,0,0,170,0,0,0,251,0,0,0,67,0,0,0,77,0,0,0,51,0,0,0,133,0,0,0,69,0,0,0,249,0,0,0,2,0,0,0,127,0,0,0,80,0,0,0,60,0,0,0,159,0,0,0,168,0,0,0,81,0,0,0,163,0,0,0,64,0,0,0,143,0,0,0,146,0,0,0,157,0,0,0,56,0,0,0,245,0,0,0,188,0,0,0,182,0,0,0,218,0,0,0,33,0,0,0,16,0,0,0,255,0,0,0,243,0,0,0,210,0,0,0,205,0,0,0,12,0,0,0,19,0,0,0,236,0,0,0,95,0,0,0,151,0,0,0,68,0,0,0,23,0,0,0,196,0,0,0,167,0,0,0,126,0,0,0,61,0,0,0,100,0,0,0,93,0,0,0,25,0,0,0,115,0,0,0,96,0,0,0,129,0,0,0,79,0,0,0,220,0,0,0,34,0,0,0,42,0,0,0,144,0,0,0,136,0,0,0,70,0,0,0,238,0,0,0,184,0,0,0,20,0,0,0,222,0,0,0,94,0,0,0,11,0,0,0,219,0,0,0,224,0,0,0,50,0,0,0,58,0,0,0,10,0,0,0,73,0,0,0,6,0,0,0,36,0,0,0,92,0,0,0,194,0,0,0,211,0,0,0,172,0,0,0,98,0,0,0,145,0,0,0,149,0,0,0,228,0,0,0,121,0,0,0,231,0,0,0,200,0,0,0,55,0,0,0,109,0,0,0,141,0,0,0,213,0,0,0,78,0,0,0,169,0,0,0,108,0,0,0,86,0,0,0,244,0,0,0,234,0,0,0,101,0,0,0,122,0,0,0,174,0,0,0,8,0,0,0,186,0,0,0,120,0,0,0,37,0,0,0,46,0,0,0,28,0,0,0,166,0,0,0,180,0,0,0,198,0,0,0,232,0,0,0,221,0,0,0,116,0,0,0,31,0,0,0,75,0,0,0,189,0,0,0,139,0,0,0,138,0,0,0,112,0,0,0,62,0,0,0,181,0,0,0,102,0,0,0,72,0,0,0,3,0,0,0,246,0,0,0,14,0,0,0,97,0,0,0,53,0,0,0,87,0,0,0,185,0,0,0,134,0,0,0,193,0,0,0,29,0,0,0,158,0,0,0,225,0,0,0,248,0,0,0,152,0,0,0,17,0,0,0,105,0,0,0,217,0,0,0,142,0,0,0,148,0,0,0,155,0,0,0,30,0,0,0,135,0,0,0,233,0,0,0,206,0,0,0,85,0,0,0,40,0,0,0,223,0,0,0,140,0,0,0,161,0,0,0,137,0,0,0,13,0,0,0,191,0,0,0,230,0,0,0,66,0,0,0,104,0,0,0,65,0,0,0,153,0,0,0,45,0,0,0,15,0,0,0,176,0,0,0,84,0,0,0,187,0,0,0,22,0,0,0,0,99,0,0,0,124,0,0,0,119,0,0,0,123,0,0,0,242,0,0,0,107,0,0,0,111,0,0,0,197,0,0,0,48,0,0,0,1,0,0,0,103,0,0,0,43,0,0,0,254,0,0,0,215,0,0,0,171,0,0,0,118,0,0,0,202,0,0,0,130,0,0,0,201,0,0,0,125,0,0,0,250,0,0,0,89,0,0,0,71,0,0,0,240,0,0,0,173,0,0,0,212,0,0,0,162,0,0,0,175,0,0,0,156,0,0,0,164,0,0,0,114,0,0,0,192,0,0,0,183,0,0,0,253,0,0,0,147,0,0,0,38,0,0,0,54,0,0,0,63,0,0,0,247,0,0,0,204,0,0,0,52,0,0,0,165,0,0,0,229,0,0,0,241,0,0,0,113,0,0,0,216,0,0,0,49,0,0,0,21,0,0,0,4,0,0,0,199,0,0,0,35,0,0,0,195,0,0,0,24,0,0,0,150,0,0,0,5,0,0,0,154,0,0,0,7,0,0,0,18,0,0,0,128,0,0,0,226,0,0,0,235,0,0,0,39,0,0,0,178,0,0,0,117,0,0,0,9,0,0,0,131,0,0,0,44,0,0,0,26,0,0,0,27,0,0,0,110,0,0,0,90,0,0,0,160,0,0,0,82,0,0,0,59,0,0,0,214,0,0,0,179,0,0,0,41,0,0,0,227,0,0,0,47,0,0,0,132,0,0,0,83,0,0,0,209,0,0,0,0,0,0,0,237,0,0,0,32,0,0,0,252,0,0,0,177,0,0,0,91,0,0,0,106,0,0,0,203,0,0,0,190,0,0,0,57,0,0,0,74,0,0,0,76,0,0,0,88,0,0,0,207,0,0,0,208,0,0,0,239,0,0,0,170,0,0,0,251,0,0,0,67,0,0,0,77,0,0,0,51,0,0,0,133,0,0,0,69,0,0,0,249,0,0,0,2,0,0,0,127,0,0,0,80,0,0,0,60,0,0,0,159,0,0,0,168,0,0,0,81,0,0,0,163,0,0,0,64,0,0,0,143,0,0,0,146,0,0,0,157,0,0,0,56,0,0,0,245,0,0,0,188,0,0,0,182,0,0,0,218,0,0,0,33,0,0,0,16,0,0,0,255,0,0,0,243,0,0,0,210,0,0,0,205,0,0,0,12,0,0,0,19,0,0,0,236,0,0,0,95,0,0,0,151,0,0,0,68,0,0,0,23,0,0,0,196,0,0,0,167,0,0,0,126,0,0,0,61,0,0,0,100,0,0,0,93,0,0,0,25,0,0,0,115,0,0,0,96,0,0,0,129,0,0,0,79,0,0,0,220,0,0,0,34,0,0,0,42,0,0,0,144,0,0,0,136,0,0,0,70,0,0,0,238,0,0,0,184,0,0,0,20,0,0,0,222,0,0,0,94,0,0,0,11,0,0,0,219,0,0,0,224,0,0,0,50,0,0,0,58,0,0,0,10,0,0,0,73,0,0,0,6,0,0,0,36,0,0,0,92,0,0,0,194,0,0,0,211,0,0,0,172,0,0,0,98,0,0,0,145,0,0,0,149,0,0,0,228,0,0,0,121,0,0,0,231,0,0,0,200,0,0,0,55,0,0,0,109,0,0,0,141,0,0,0,213,0,0,0,78,0,0,0,169,0,0,0,108,0,0,0,86,0,0,0,244,0,0,0,234,0,0,0,101,0,0,0,122,0,0,0,174,0,0,0,8,0,0,0,186,0,0,0,120,0,0,0,37,0,0,0,46,0,0,0,28,0,0,0,166,0,0,0,180,0,0,0,198,0,0,0,232,0,0,0,221,0,0,0,116,0,0,0,31,0,0,0,75,0,0,0,189,0,0,0,139,0,0,0,138,0,0,0,112,0,0,0,62,0,0,0,181,0,0,0,102,0,0,0,72,0,0,0,3,0,0,0,246,0,0,0,14,0,0,0,97,0,0,0,53,0,0,0,87,0,0,0,185,0,0,0,134,0,0,0,193,0,0,0,29,0,0,0,158,0,0,0,225,0,0,0,248,0,0,0,152,0,0,0,17,0,0,0,105,0,0,0,217,0,0,0,142,0,0,0,148,0,0,0,155,0,0,0,30,0,0,0,135,0,0,0,233,0,0,0,206,0,0,0,85,0,0,0,40,0,0,0,223,0,0,0,140,0,0,0,161,0,0,0,137,0,0,0,13,0,0,0,191,0,0,0,230,0,0,0,66,0,0,0,104,0,0,0,65,0,0,0,153,0,0,0,45,0,0,0,15,0,0,0,176,0,0,0,84,0,0,0,187,0,0,0,22], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+20481);
/* memory initializer */ allocate([93,0,0,13,0,0,0,14,0,0,0,3,0,0,0,8,0,0,0,2,0,0,0,2,0,0,0,6,0,0,0,7,0,0,0,9,0,0,0,8,0,0,0,9,0,0,0,5,0,0,0,10,0,0,0,6,0,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,119,69,69,0,0,0,0,0,0,0,0,64,139,0,0,224,92,0,0,176,99,0,0,0,0,0,0,0,0,0,0,104,93,0,0,15,0,0,0,16,0,0,0,4,0,0,0,8,0,0,0,2,0,0,0,2,0,0,0,10,0,0,0,7,0,0,0,9,0,0,0,11,0,0,0,12,0,0,0,7,0,0,0,11,0,0,0,8,0,0,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,119,69,69,0,64,139,0,0,80,93,0,0,176,99,0,0,0,0,0,0,117,110,115,117,112,112,111,114,116,101,100,32,108,111,99,97,108,101,32,102,111,114,32,115,116,97,110,100,97,114,100,32,105,110,112,117,116,0,0,0,0,0,0,0,0,94,0,0,17,0,0,0,18,0,0,0,5,0,0,0,5,0,0,0,3,0,0,0,3,0,0,0,13,0,0,0,3,0,0,0,6,0,0,0,14,0,0,0,5,0,0,0,9,0,0,0,12,0,0,0,10,0,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,99,69,69,0,0,0,0,0,0,0,0,64,139,0,0,224,93,0,0,112,99,0,0,0,0,0,0,0,0,0,0,104,94,0,0,19,0,0,0,20,0,0,0,6,0,0,0,5,0,0,0,3,0,0,0,3,0,0,0,2,0,0,0,3,0,0,0,6,0,0,0,15,0,0,0,16,0,0,0,11,0,0,0,7,0,0,0,12,0,0,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,99,69,69,0,64,139,0,0,80,94,0,0,112,99,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,115,104,97,114,101,100,95,99,111,117,110,116,69,0,0,0,0,0,0,0,0,24,139,0,0,120,94,0,0,0,0,0,0,224,94,0,0,21,0,0,0,22,0,0,0,17,0,0,0,0,0,0,0,0,0,0,0,200,95,0,0,23,0,0,0,24,0,0,0,18,0,0,0,0,0,0,0,83,116,49,49,108,111,103,105,99,95,101,114,114,111,114,0,64,139,0,0,208,94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,95,0,0,21,0,0,0,25,0,0,0,17,0,0,0,0,0,0,0,83,116,49,54,105,110,118,97,108,105,100,95,97,114,103,117,109,101,110,116,0,0,0,0,64,139,0,0,8,95,0,0,224,94,0,0,0,0,0,0,0,0,0,0,96,95,0,0,21,0,0,0,26,0,0,0,17,0,0,0,0,0,0,0,83,116,49,50,108,101,110,103,116,104,95,101,114,114,111,114,0,0,0,0,0,0,0,0,64,139,0,0,72,95,0,0,224,94,0,0,0,0,0,0,0,0,0,0,160,95,0,0,21,0,0,0,27,0,0,0,17,0,0,0,0,0,0,0,83,116,49,50,111,117,116,95,111,102,95,114,97,110,103,101,0,0,0,0,0,0,0,0,64,139,0,0,136,95,0,0,224,94,0,0,0,0,0,0,83,116,49,51,114,117,110,116,105,109,101,95,101,114,114,111,114,0,0,0,0,0,0,0,64,139,0,0,176,95,0,0,0,0,0,0,0,0,0,0,58,32,0,0,0,0,0,0,0,0,0,0,16,96,0,0,28,0,0,0,29,0,0,0,18,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,50,115,121,115,116,101,109,95,101,114,114,111,114,69,0,0,64,139,0,0,248,95,0,0,200,95,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,101,114,114,111,114,95,99,97,116,101,103,111,114,121,69,0,0,0,0,0,0,0,0,24,139,0,0,32,96,0,0,78,83,116,51,95,95,49,49,50,95,95,100,111,95,109,101,115,115,97,103,101,69,0,0,64,139,0,0,72,96,0,0,64,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,97,115,105,99,95,115,116,114,105,110,103,0,0,0,0,0,0,0,0,112,99,0,0,30,0,0,0,31,0,0,0,2,0,0,0,5,0,0,0,3,0,0,0,3,0,0,0,2,0,0,0,3,0,0,0,6,0,0,0,14,0,0,0,5,0,0,0,9,0,0,0,7,0,0,0,12,0,0,0,0,0,0,0,176,99,0,0,32,0,0,0,33,0,0,0,7,0,0,0,8,0,0,0,2,0,0,0,2,0,0,0,10,0,0,0,7,0,0,0,9,0,0,0,8,0,0,0,9,0,0,0,5,0,0,0,11,0,0,0,8,0,0,0,8,0,0,0,0,0,0,0,232,99,0,0,7,0,0,0,8,0,0,0,248,255,255,255,248,255,255,255,232,99,0,0,9,0,0,0,10,0,0,0,8,0,0,0,0,0,0,0,48,100,0,0,34,0,0,0,35,0,0,0,248,255,255,255,248,255,255,255,48,100,0,0,36,0,0,0,37,0,0,0,4,0,0,0,0,0,0,0,120,100,0,0,38,0,0,0,39,0,0,0,252,255,255,255,252,255,255,255,120,100,0,0,40,0,0,0,41,0,0,0,4,0,0,0,0,0,0,0,192,100,0,0,42,0,0,0,43,0,0,0,252,255,255,255,252,255,255,255,192,100,0,0,44,0,0,0,45,0,0,0,105,111,115,116,114,101,97,109,0,0,0,0,0,0,0,0,117,110,115,112,101,99,105,102,105,101,100,32,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,32,101,114,114,111,114,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,98,0,0,46,0,0,0,47,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,176,98,0,0,48,0,0,0,49,0,0,0,105,111,115,95,98,97,115,101,58,58,99,108,101,97,114,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,55,102,97,105,108,117,114,101,69,0,0,0,0,0,0,0,64,139,0,0,104,98,0,0,16,96,0,0,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,69,0,0,0,0,0,0,0,24,139,0,0,152,98,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,64,139,0,0,184,98,0,0,176,98,0,0,0,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,64,139,0,0,248,98,0,0,176,98,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,0,24,139,0,0,56,99,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,0,24,139,0,0,120,99,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,160,139,0,0,184,99,0,0,0,0,0,0,1,0,0,0,232,98,0,0,3,244,255,255,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,160,139,0,0,0,100,0,0,0,0,0,0,1,0,0,0,40,99,0,0,3,244,255,255,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,160,139,0,0,72,100,0,0,0,0,0,0,1,0,0,0,232,98,0,0,3,244,255,255,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,160,139,0,0,144,100,0,0,0,0,0,0,1,0,0,0,40,99,0,0,3,244,255,255,0,0,0,0,32,101,0,0,50,0,0,0,51,0,0,0,19,0,0,0,1,0,0,0,13,0,0,0,14,0,0,0,2,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,57,95,95,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,69,0,0,0,64,139,0,0,0,101,0,0,96,96,0,0,0,0,0,0,0,0,0,0,72,115,0,0,52,0,0,0,53,0,0,0,54,0,0,0,1,0,0,0,4,0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,115,0,0,55,0,0,0,56,0,0,0,54,0,0,0,2,0,0,0,5,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,120,0,0,57,0,0,0,58,0,0,0,54,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,65,66,67,68,69,70,120,88,43,45,112,80,105,73,110,78,0,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,0,0,0,0,184,120,0,0,59,0,0,0,60,0,0,0,54,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,16,0,0,0,17,0,0,0,18,0,0,0,19,0,0,0,20,0,0,0,21,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,121,0,0,61,0,0,0,62,0,0,0,54,0,0,0,4,0,0,0,5,0,0,0,23,0,0,0,6,0,0,0,24,0,0,0,1,0,0,0,2,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,122,0,0,63,0,0,0,64,0,0,0,54,0,0,0,8,0,0,0,9,0,0,0,25,0,0,0,10,0,0,0,26,0,0,0,3,0,0,0,4,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,0,0,0,0,56,117,0,0,65,0,0,0,66,0,0,0,54,0,0,0,20,0,0,0,27,0,0,0,28,0,0,0,29,0,0,0,30,0,0,0,31,0,0,0,1,0,0,0,248,255,255,255,56,117,0,0,21,0,0,0,22,0,0,0,23,0,0,0,24,0,0,0,25,0,0,0,26,0,0,0,27,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,72,58,37,77,58,37,83,37,109,47,37,100,47,37,121,37,89,45,37,109,45,37,100,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,37,72,58,37,77,0,0,0,37,72,58,37,77,58,37,83,0,0,0,0,216,117,0,0,67,0,0,0,68,0,0,0,54,0,0,0,28,0,0,0,32,0,0,0,33,0,0,0,34,0,0,0,35,0,0,0,36,0,0,0,2,0,0,0,248,255,255,255,216,117,0,0,29,0,0,0,30,0,0,0,31,0,0,0,32,0,0,0,33,0,0,0,34,0,0,0,35,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,37,0,0,0,89,0,0,0,45,0,0,0,37,0,0,0,109,0,0,0,45,0,0,0,37,0,0,0,100,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,0,0,0,0,104,118,0,0,69,0,0,0,70,0,0,0,54,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,118,0,0,71,0,0,0,72,0,0,0,54,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,115,0,0,73,0,0,0,74,0,0,0,54,0,0,0,36,0,0,0,37,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,38,0,0,0,12,0,0,0,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,116,0,0,75,0,0,0,76,0,0,0,54,0,0,0,39,0,0,0,40,0,0,0,14,0,0,0,15,0,0,0,16,0,0,0,17,0,0,0,41,0,0,0,18,0,0,0,19,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,116,0,0,77,0,0,0,78,0,0,0,54,0,0,0,42,0,0,0,43,0,0,0,20,0,0,0,21,0,0,0,22,0,0,0,23,0,0,0,44,0,0,0,24,0,0,0,25,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,116,0,0,79,0,0,0,80,0,0,0,54,0,0,0,45,0,0,0,46,0,0,0,26,0,0,0,27,0,0,0,28,0,0,0,29,0,0,0,47,0,0,0,30,0,0,0,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,122,0,0,81,0,0,0,82,0,0,0,54,0,0,0,3,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,37,76,102,0,0,0,0,0,109,111,110,101,121,95,103,101,116,32,101,114,114,111,114,0,0,0,0,0,48,123,0,0,83,0,0,0,84,0,0,0,54,0,0,0,5,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,0,0,0,0,192,123,0,0,85,0,0,0,86,0,0,0,54,0,0,0,1,0,0,0,37,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,46,48,76,102,0,0,0,0,0,0,0,80,124,0,0,87,0,0,0,88,0,0,0,54,0,0,0,2,0,0,0,38,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,119,0,0,89,0,0,0,90,0,0,0,54,0,0,0,17,0,0,0,12,0,0,0,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,119,0,0,91,0,0,0,92,0,0,0,54,0,0,0,18,0,0,0,13,0,0,0,33,0,0,0,0,0,0,0,0,0,0,0,118,101,99,116,111,114,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,67,0,0,0,0,0,0,0,0,0,0,0,32,115,0,0,93,0,0,0,94,0,0,0,54,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,111,0,0,95,0,0,0,96,0,0,0,54,0,0,0,13,0,0,0,19,0,0,0,14,0,0,0,20,0,0,0,15,0,0,0,3,0,0,0,21,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,112,0,0,97,0,0,0,98,0,0,0,54,0,0,0,1,0,0,0,2,0,0,0,4,0,0,0,48,0,0,0,49,0,0,0,5,0,0,0,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,114,0,0,99,0,0,0,100,0,0,0,54,0,0,0,51,0,0,0,52,0,0,0,34,0,0,0,35,0,0,0,36,0,0,0,0,0,0,0,248,114,0,0,101,0,0,0,102,0,0,0,54,0,0,0,53,0,0,0,54,0,0,0,37,0,0,0,38,0,0,0,39,0,0,0,116,114,117,101,0,0,0,0,116,0,0,0,114,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,102,97,108,115,101,0,0,0,102,0,0,0,97,0,0,0,108,0,0,0,115,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,109,47,37,100,47,37,121,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,72,58,37,77,58,37,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,97,32,37,98,32,37,100,32,37,72,58,37,77,58,37,83,32,37,89,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,0,0,0,97,0,0,0,32,0,0,0,37,0,0,0,98,0,0,0,32,0,0,0,37,0,0,0,100,0,0,0,32,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,89,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,108,111,99,97,108,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,0,0,0,0,48,111,0,0,103,0,0,0,104,0,0,0,54,0,0,0,0,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,102,97,99,101,116,69,0,0,0,64,139,0,0,24,111,0,0,152,94,0,0,0,0,0,0,0,0,0,0,192,111,0,0,103,0,0,0,105,0,0,0,54,0,0,0,22,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,16,0,0,0,23,0,0,0,17,0,0,0,24,0,0,0,18,0,0,0,7,0,0,0,25,0,0,0,6,0,0,0,0,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,99,116,121,112,101,95,98,97,115,101,69,0,0,0,0,24,139,0,0,160,111,0,0,160,139,0,0,136,111,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,184,111,0,0,2,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,99,69,69,0,0,0,0,0,0,0,160,139,0,0,224,111,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,184,111,0,0,2,0,0,0,0,0,0,0,144,112,0,0,103,0,0,0,106,0,0,0,54,0,0,0,3,0,0,0,4,0,0,0,7,0,0,0,55,0,0,0,56,0,0,0,8,0,0,0,57,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,99,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,50,99,111,100,101,99,118,116,95,98,97,115,101,69,0,0,24,139,0,0,112,112,0,0,160,139,0,0,72,112,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,136,112,0,0,2,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,119,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,160,139,0,0,176,112,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,136,112,0,0,2,0,0,0,0,0,0,0,80,113,0,0,103,0,0,0,107,0,0,0,54,0,0,0,5,0,0,0,6,0,0,0,9,0,0,0,58,0,0,0,59,0,0,0,10,0,0,0,60,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,115,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,160,139,0,0,40,113,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,136,112,0,0,2,0,0,0,0,0,0,0,200,113,0,0,103,0,0,0,108,0,0,0,54,0,0,0,7,0,0,0,8,0,0,0,11,0,0,0,61,0,0,0,62,0,0,0,12,0,0,0,63,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,105,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,160,139,0,0,160,113,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,136,112,0,0,2,0,0,0,0,0,0,0,64,114,0,0,103,0,0,0,109,0,0,0,54,0,0,0,7,0,0,0,8,0,0,0,11,0,0,0,61,0,0,0,62,0,0,0,12,0,0,0,63,0,0,0,78,83,116,51,95,95,49,49,54,95,95,110,97,114,114,111,119,95,116,111,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,0,64,139,0,0,24,114,0,0,200,113,0,0,0,0,0,0,0,0,0,0,168,114,0,0,103,0,0,0,110,0,0,0,54,0,0,0,7,0,0,0,8,0,0,0,11,0,0,0,61,0,0,0,62,0,0,0,12,0,0,0,63,0,0,0,78,83,116,51,95,95,49,49,55,95,95,119,105,100,101,110,95,102,114,111,109,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,64,139,0,0,128,114,0,0,200,113,0,0,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,99,69,69,0,0,0,0,64,139,0,0,184,114,0,0,48,111,0,0,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,119,69,69,0,0,0,0,64,139,0,0,224,114,0,0,48,111,0,0,0,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,95,95,105,109,112,69,0,0,0,64,139,0,0,8,115,0,0,48,111,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,99,69,69,0,0,0,0,0,64,139,0,0,48,115,0,0,48,111,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,119,69,69,0,0,0,0,0,64,139,0,0,88,115,0,0,48,111,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,95,98,97,115,101,69,0,0,0,0,24,139,0,0,160,115,0,0,160,139,0,0,128,115,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,184,115,0,0,2,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,49,69,69,69,0,0,0,0,0,160,139,0,0,224,115,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,184,115,0,0,2,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,48,69,69,69,0,0,0,0,0,160,139,0,0,32,116,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,184,115,0,0,2,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,49,69,69,69,0,0,0,0,0,160,139,0,0,96,116,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,184,115,0,0,2,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,57,116,105,109,101,95,98,97,115,101,69,0,0,0,0,0,0,24,139,0,0,232,116,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,99,69,69,0,0,0,0,0,0,0,24,139,0,0,8,117,0,0,160,139,0,0,160,116,0,0,0,0,0,0,3,0,0,0,48,111,0,0,2,0,0,0,0,117,0,0,2,0,0,0,48,117,0,0,0,8,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,119,69,69,0,0,0,0,0,0,0,24,139,0,0,168,117,0,0,160,139,0,0,96,117,0,0,0,0,0,0,3,0,0,0,48,111,0,0,2,0,0,0,0,117,0,0,2,0,0,0,208,117,0,0,0,8,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,116,105,109,101,95,112,117,116,69,0,0,0,0,24,139,0,0,72,118,0,0,160,139,0,0,0,118,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,96,118,0,0,0,8,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,160,139,0,0,136,118,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,96,118,0,0,0,8,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,49,51,109,101,115,115,97,103,101,115,95,98,97,115,101,69,0,24,139,0,0,8,119,0,0,160,139,0,0,240,118,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,32,119,0,0,2,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,119,69,69,0,0,0,0,160,139,0,0,72,119,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,32,119,0,0,2,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,103,101,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,24,139,0,0,224,119,0,0,160,139,0,0,200,119,0,0,0,0,0,0,1,0,0,0,0,120,0,0,0,0,0,0,160,139,0,0,128,119,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,8,120,0,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,119,69,69,0,0,0,160,139,0,0,136,120,0,0,0,0,0,0,1,0,0,0,0,120,0,0,0,0,0,0,160,139,0,0,64,120,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,160,120,0,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,112,117,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,24,139,0,0,56,121,0,0,160,139,0,0,32,121,0,0,0,0,0,0,1,0,0,0,88,121,0,0,0,0,0,0,160,139,0,0,216,120,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,96,121,0,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,119,69,69,0,0,0,160,139,0,0,224,121,0,0,0,0,0,0,1,0,0,0,88,121,0,0,0,0,0,0,160,139,0,0,152,121,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,248,121,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,99,69,69,0,0,0,0,0,0,0,0,24,139,0,0,120,122,0,0,160,139,0,0,48,122,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,152,122,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,119,69,69,0,0,0,0,0,0,0,0,24,139,0,0,8,123,0,0,160,139,0,0,192,122,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,40,123,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,99,69,69,0,0,0,0,0,0,0,0,24,139,0,0,152,123,0,0,160,139,0,0,80,123,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,184,123,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,119,69,69,0,0,0,0,0,0,0,0,24,139,0,0,40,124,0,0,160,139,0,0,224,123,0,0,0,0,0,0,2,0,0,0,48,111,0,0,2,0,0,0,72,124,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,65,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,80,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,65,77,0,0,0,0,0,0,80,77,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,114,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,99,0,0,0,104,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,105,0,0,0,108,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,117,0,0,0,115,0,0,0,116,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,116,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,111,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,0,0,0,0,68,0,0,0,101,0,0,0,99], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+23709);
/* memory initializer */ allocate([74,97,110,117,97,114,121,0,70,101,98,114,117,97,114,121,0,0,0,0,0,0,0,0,77,97,114,99,104,0,0,0,65,112,114,105,108,0,0,0,77,97,121,0,0,0,0,0,74,117,110,101,0,0,0,0,74,117,108,121,0,0,0,0,65,117,103,117,115,116,0,0,83,101,112,116,101,109,98,101,114,0,0,0,0,0,0,0,79,99,116,111,98,101,114,0,78,111,118,101,109,98,101,114,0,0,0,0,0,0,0,0,68,101,99,101,109,98,101,114,0,0,0,0,0,0,0,0,74,97,110,0,0,0,0,0,70,101,98,0,0,0,0,0,77,97,114,0,0,0,0,0,65,112,114,0,0,0,0,0,74,117,110,0,0,0,0,0,74,117,108,0,0,0,0,0,65,117,103,0,0,0,0,0,83,101,112,0,0,0,0,0,79,99,116,0,0,0,0,0,78,111,118,0,0,0,0,0,68,101,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,110,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,114,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,117,0,0,0,114,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,0,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,117,110,100,97,121,0,0,77,111,110,100,97,121,0,0,84,117,101,115,100,97,121,0,87,101,100,110,101,115,100,97,121,0,0,0,0,0,0,0,84,104,117,114,115,100,97,121,0,0,0,0,0,0,0,0,70,114,105,100,97,121,0,0,83,97,116,117,114,100,97,121,0,0,0,0,0,0,0,0,83,117,110,0,0,0,0,0,77,111,110,0,0,0,0,0,84,117,101,0,0,0,0,0,87,101,100,0,0,0,0,0,84,104,117,0,0,0,0,0,70,114,105,0,0,0,0,0,83,97,116,0,0,0,0,0,2,0,0,192,3,0,0,192,4,0,0,192,5,0,0,192,6,0,0,192,7,0,0,192,8,0,0,192,9,0,0,192,10,0,0,192,11,0,0,192,12,0,0,192,13,0,0,192,14,0,0,192,15,0,0,192,16,0,0,192,17,0,0,192,18,0,0,192,19,0,0,192,20,0,0,192,21,0,0,192,22,0,0,192,23,0,0,192,24,0,0,192,25,0,0,192,26,0,0,192,27,0,0,192,28,0,0,192,29,0,0,192,30,0,0,192,31,0,0,192,0,0,0,179,1,0,0,195,2,0,0,195,3,0,0,195,4,0,0,195,5,0,0,195,6,0,0,195,7,0,0,195,8,0,0,195,9,0,0,195,10,0,0,195,11,0,0,195,12,0,0,195,13,0,0,211,14,0,0,195,15,0,0,195,0,0,12,187,1,0,12,195,2,0,12,195,3,0,12,195,4,0,12,211,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,138,0,0,111,0,0,0,112,0,0,0,64,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,99,97,115,116,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,24,139,0,0,104,138,0,0,83,116,56,98,97,100,95,99,97,115,116,0,0,0,0,0,64,139,0,0,128,138,0,0,0,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,64,139,0,0,160,138,0,0,120,138,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,64,139,0,0,216,138,0,0,200,138,0,0,0,0,0,0,0,0,0,0,0,139,0,0,113,0,0,0,114,0,0,0,115,0,0,0,116,0,0,0,26,0,0,0,14,0,0,0,1,0,0,0,6,0,0,0,0,0,0,0,136,139,0,0,113,0,0,0,117,0,0,0,115,0,0,0,116,0,0,0,26,0,0,0,15,0,0,0,2,0,0,0,7,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,64,139,0,0,96,139,0,0,0,139,0,0,0,0,0,0,0,0,0,0,232,139,0,0,113,0,0,0,118,0,0,0,115,0,0,0,116,0,0,0,26,0,0,0,16,0,0,0,3,0,0,0,8,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,64,139,0,0,192,139,0,0,0,139,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,142,0,0,119,0,0,0,120,0,0,0,65,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,64,139,0,0,24,142,0,0,0,0,0,0,0,0,0,0,105,110,102,105,110,105,116,121,0,0,0,0,0,0,0,0,110,97,110,0,0,0,0,0,95,112,137,0,255,9,47,15,10,0,0,0,100,0,0,0,232,3,0,0,16,39,0,0,160,134,1,0,64,66,15,0,128,150,152,0,0,225,245,5], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+34096);




var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;

   
  Module["_i64Subtract"] = _i64Subtract;

   
  Module["_i64Add"] = _i64Add;

  
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  
  
  
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  
  
  
  var ___cxa_last_thrown_exception=0;function ___resumeException(ptr) {
      if (!___cxa_last_thrown_exception) { ___cxa_last_thrown_exception = ptr; }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
    }
  
  var ___cxa_exception_header_size=8;function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = ___cxa_last_thrown_exception;
      header = thrown - ___cxa_exception_header_size;
      if (throwntype == -1) throwntype = HEAP32[((header)>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
  
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return ((asm["setTempRet0"](typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm["setTempRet0"](throwntype),thrown)|0);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      var header = ptr - ___cxa_exception_header_size;
      HEAP32[((header)>>2)]=type;
      HEAP32[(((header)+(4))>>2)]=destructor;
      ___cxa_last_thrown_exception = ptr;
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
    }

  function _pthread_mutex_lock() {}

  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function() { done(this.error); };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = Math.floor(idx / this.chunkSize);
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (function(from, to) {
              if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
              if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
              // Some hints to the browser that we want binary data.
              if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              if (xhr.response !== undefined) {
                return new Uint8Array(xhr.response || []);
              } else {
                return intArrayFromString(xhr.responseText || '', true);
              }
            });
            var lazyArray = this;
            lazyArray.setDataGetter(function(chunkNum) {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
              return lazyArray.chunks[chunkNum];
            });
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }

  var _emscripten_check_longjmp=true;

  
  
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }function __parseInt(str, endptr, base, min, max, bits, unsign) {
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
  
      // Check for a plus/minus sign.
      var multiplier = 1;
      if (HEAP8[(str)] == 45) {
        multiplier = -1;
        str++;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
  
      // Find base.
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            str++;
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
  
      // Get digits.
      var chr;
      var ret = 0;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          ret = ret * finalBase + digit;
          str++;
        }
      }
  
      // Apply sign.
      ret *= multiplier;
  
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str;
      }
  
      // Unsign if needed.
      if (unsign) {
        if (Math.abs(ret) > max) {
          ret = max;
          ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          ret = unSign(ret, bits);
        }
      }
  
      // Validate range.
      if (ret > max || ret < min) {
        ret = ret > max ? max : min;
        ___setErrNo(ERRNO_CODES.ERANGE);
      }
  
      if (bits == 64) {
        return ((asm["setTempRet0"]((tempDouble=ret,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)),ret>>>0)|0);
      }
  
      return ret;
    }function _strtol(str, endptr, base) {
      return __parseInt(str, endptr, base, -2147483648, 2147483647, 32);  // LONG_MIN, LONG_MAX.
    }

  
  
   
  Module["_strlen"] = _strlen;
  
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (HEAP32[((tempDoublePtr)>>2)]=HEAP32[(((varargs)+(argIndex))>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((varargs)+((argIndex)+(4)))>>2)],(+(HEAPF64[(tempDoublePtr)>>3])));
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
  
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          }
          if (precision < 0) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
  
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
  
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
  
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
  
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
  
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
  
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
  
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
  
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
  
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
  
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length;
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }
  
  function _malloc(bytes) {
      /* Over-allocate to make sure it is byte-aligned by 8.
       * This will leak memory, but this is only the dummy
       * implementation (replaced by dlmalloc normally) so
       * not an issue.
       */
      var ptr = Runtime.dynamicAlloc(bytes + 8);
      return (ptr+8) & 0xFFFFFFF8;
    }
  Module["_malloc"] = _malloc;function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }

  var _emscripten_postinvoke=true;

  
  
  
  
  function _mkport() { throw 'TODO' }var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              // runtimeConfig gets set to true if WebSocket runtime configuration is available.
              var runtimeConfig = (Module['websocket'] && ('object' === typeof Module['websocket']));
  
              // The default value is 'ws://' the replace is needed because the compiler replaces "//" comments with '#'
              // comments without checking context, so we'd end up with ws:#, the replace swaps the "#" for "//" again.
              var url = 'ws:#'.replace('#', '//');
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['url']) {
                  url = Module['websocket']['url']; // Fetch runtime WebSocket URL config.
                }
              }
  
              if (url === 'ws://' || url === 'wss://') { // Is the supplied URL config just a prefix, if so complete it.
                url = url + addr + ':' + port;
              }
  
              // Make the WebSocket subprotocol (Sec-WebSocket-Protocol) default to binary if no configuration is set.
              var subProtocols = 'binary'; // The default value is 'binary'
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['subprotocol']) {
                  subProtocols = Module['websocket']['subprotocol']; // Fetch runtime WebSocket subprotocol config.
                }
              }
  
              // The regex trims the string (removes spaces at the beginning and end, then splits the string by
              // <any space>,<any space> into an Array. Whitespace removal is important for Websockify and ws.
              subProtocols = subProtocols.replace(/^ +| +$/g,"").split(/ *, */);
  
              // The node ws library API for specifying optional subprotocol is slightly different than the browser's.
              var opts = ENVIRONMENT_IS_NODE ? {'protocol': subProtocols.toString()} : subProtocols;
  
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      stream = FS.getStreamFromPtr(stream);
      if (!stream) return -1;
      return stream.fd;
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var fd = _fileno(stream);
      var bytesWritten = _write(fd, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }

  
  
  function __parseInt64(str, endptr, base, min, max, unsign) {
      var isNegative = false;
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
  
      // Check for a plus/minus sign.
      if (HEAP8[(str)] == 45) {
        str++;
        isNegative = true;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
  
      // Find base.
      var ok = false;
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            ok = true; // we saw an initial zero, perhaps the entire thing is just "0"
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      var start = str;
  
      // Get digits.
      var chr;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          str++;
          ok = true;
        }
      }
  
      if (!ok) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return ((asm["setTempRet0"](0),0)|0);
      }
  
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str;
      }
  
      try {
        var numberString = isNegative ? '-'+Pointer_stringify(start, str - start) : Pointer_stringify(start, str - start);
        i64Math.fromString(numberString, finalBase, min, max, unsign);
      } catch(e) {
        ___setErrNo(ERRNO_CODES.ERANGE); // not quite correct
      }
  
      return ((asm["setTempRet0"](((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)),((HEAP32[((tempDoublePtr)>>2)])|0))|0);
    }function _strtoll(str, endptr, base) {
      return __parseInt64(str, endptr, base, '-9223372036854775808', '9223372036854775807');  // LLONG_MIN, LLONG_MAX.
    }function _strtoll_l(str, endptr, base) {
      return _strtoll(str, endptr, base); // no locale support yet
    }

  
  
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr;
      var fd = _fileno(stream);
      var ret = _write(fd, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }function _putchar(c) {
      // int putchar(int c);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/putchar.html
      return _fputc(c, HEAP32[((_stdout)>>2)]);
    } 
  Module["_saveSetjmp"] = _saveSetjmp;

  var _UItoD=true;


  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  var _emscripten_prep_setjmp=true;


  function _pthread_cond_broadcast() {
      return 0;
    }

  
  
   
  Module["_testSetjmp"] = _testSetjmp;function _longjmp(env, value) {
      asm['setThrew'](env, value || 1);
      throw 'longjmp';
    }function _emscripten_longjmp(env, value) {
      _longjmp(env, value);
    }

  var _ceil=Math_ceil;

  
  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }

  function _pthread_mutex_unlock() {}

  
  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }function _isxdigit_l(chr) {
      return _isxdigit(chr); // no locale support yet
    }

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }


  function _newlocale(mask, locale, base) {
      return _malloc(4);
    }

   
  Module["_memmove"] = _memmove;

  var _emscripten_preinvoke=true;

  var _BItoD=true;

  function _catclose(catd) {
      // int catclose (nl_catd catd)
      return 0;
    }

  
  
  
  function _free() {
  }
  Module["_free"] = _free;function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr - ___cxa_exception_header_size);
      } catch(e) { // XXX FIXME
      }
    }
  
  var ___cxa_caught_exceptions=[];function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      asm['setThrew'](0);
      // Call destructor if one is registered then clear it.
      var ptr = ___cxa_caught_exceptions.pop();
      if (ptr) {
        header = ptr - ___cxa_exception_header_size;
        var destructor = HEAP32[(((header)+(4))>>2)];
        if (destructor) {
          Runtime.dynCall('vi', destructor, [ptr]);
          HEAP32[(((header)+(4))>>2)]=0;
        }
        ___cxa_free_exception(ptr);
        ___cxa_last_thrown_exception = 0;
      }
    }function ___cxa_rethrow() {
      ___cxa_end_catch.rethrown = true;
      var ptr = ___cxa_caught_exceptions.pop();
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
    }

  function _fmod(x, y) {
      return x % y;
    }

  function ___cxa_guard_release() {}

  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStreamFromPtr(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }

  function _uselocale(locale) {
      return 0;
    }

  function _vsnprintf(s, n, format, va_arg) {
      return _snprintf(s, n, format, HEAP32[((va_arg)>>2)]);
    }

  
  
  
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
  
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
  
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
                if (next === 0) return i > 0 ? fields : fields-1; // we failed to read the full length of this field
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
  
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
  
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
  
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
  
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
  
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
  
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
  
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16);
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text);
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text);
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j];
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      function get() { return HEAP8[(((s)+(index++))|0)]; };
      function unget() { index--; };
      return __scanString(format, get, unget, varargs);
    }function _vsscanf(s, format, va_arg) {
      return _sscanf(s, format, HEAP32[((va_arg)>>2)]);
    }


  function ___assert_fail(condition, filename, line, func) {
      ABORT = true;
      throw 'Assertion failed: ' + Pointer_stringify(condition) + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + stackTrace();
    }

  
  
  
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStreamFromPtr(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop();
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(streamObj.fd, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStreamFromPtr(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }

  function ___errno_location() {
      return ___errno_state;
    }

   
  Module["_memset"] = _memset;

  
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }

  
  
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  
  
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
  
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
  
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
  
      var pattern = Pointer_stringify(format);
  
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
  
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
  
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
  
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
  
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
  
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
  
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
  
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
  
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
  
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
  
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
  
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
  
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
  
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }function _strftime_l(s, maxsize, format, tm) {
      return _strftime(s, maxsize, format, tm); // no locale support yet
    }

  function _abort() {
      Module['abort']();
    }

  function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }

  function _catgets(catd, set_id, msg_id, s) {
      // char *catgets (nl_catd catd, int set_id, int msg_id, const char *s)
      return s;
    }


  function _pthread_cond_wait() {
      return 0;
    }

  
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }function _isdigit_l(chr) {
      return _isdigit(chr); // no locale support yet
    }

  var _fabs=Math_abs;

  var _getc=_fgetc;


  var Browser={mainLoop:{scheduler:null,method:"",shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        
        // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
        // Module['forcedAspectRatio'] = 4 / 3;
        
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'] ||
                                    canvas['msRequestPointerLock'] ||
                                    function(){};
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 document['msExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas ||
                                document['msPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvasContainer.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        return Math.max(-1, Math.min(1, event.type === 'DOMMouseScroll' ? event.detail : -event.wheelDelta));
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              Browser.lastTouches[touch.identifier] = Browser.touches[touch.identifier];
              Browser.touches[touch.identifier] = { x: adjustedX, y: adjustedY };
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      }};

  var _emscripten_get_longjmp_result=true;

  function ___ctype_b_loc() {
      // http://refspecs.freestandards.org/LSB_3.0.0/LSB-Core-generic/LSB-Core-generic/baselib---ctype-b-loc.html
      var me = ___ctype_b_loc;
      if (!me.ret) {
        var values = [
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,8195,8194,8194,8194,8194,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,24577,49156,49156,49156,
          49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,55304,55304,55304,55304,55304,55304,55304,55304,
          55304,55304,49156,49156,49156,49156,49156,49156,49156,54536,54536,54536,54536,54536,54536,50440,50440,50440,50440,50440,
          50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,49156,49156,49156,49156,49156,
          49156,54792,54792,54792,54792,54792,54792,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,
          50696,50696,50696,50696,50696,50696,50696,49156,49156,49156,49156,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ];
        var i16size = 2;
        var arr = _malloc(values.length * i16size);
        for (var i = 0; i < values.length; i++) {
          HEAP16[(((arr)+(i * i16size))>>1)]=values[i];
        }
        me.ret = allocate([arr + 128 * i16size], 'i16*', ALLOC_NORMAL);
      }
      return me.ret;
    }

  function _freelocale(locale) {
      _free(locale);
    }

  function ___cxa_allocate_exception(size) {
      var ptr = _malloc(size + ___cxa_exception_header_size);
      return ptr + ___cxa_exception_header_size;
    }

  var _fmodl=_fmod;

  
  function _strtoull(str, endptr, base) {
      return __parseInt64(str, endptr, base, 0, '18446744073709551615', true);  // ULONG_MAX.
    }function _strtoull_l(str, endptr, base) {
      return _strtoull(str, endptr, base); // no locale support yet
    }

  function _catopen(name, oflag) {
      // nl_catd catopen (const char *name, int oflag)
      return -1;
    }


  
  
  function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }function _asprintf(s, format, varargs) {
      return _sprintf(-s, format, varargs);
    }function _vasprintf(s, format, va_arg) {
      return _asprintf(s, format, HEAP32[((va_arg)>>2)]);
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  function _copysign(a, b) {
      return __reallyNegative(a) === __reallyNegative(b) ? a : -a;
    }

  function ___ctype_toupper_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-toupper-loc.html
      var me = ___ctype_toupper_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,
          73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
          81,82,83,84,85,86,87,88,89,90,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,
          145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,
          175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,
          205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,
          235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i];
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }

  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }

  function ___ctype_tolower_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-tolower-loc.html
      var me = ___ctype_tolower_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,91,92,93,94,95,96,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,
          134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,
          164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,
          194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
          224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,
          254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i];
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }

  function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      ___cxa_caught_exceptions.push(___cxa_last_thrown_exception);
      return ptr;
    }

   
  Module["_bitshift64Shl"] = _bitshift64Shl;

  var _emscripten_setjmp=true;

  function __ZNSt9exceptionD2Ev() {}

  var _copysignl=_copysign;

  var __ZTISt9exception=allocate([allocate([1,0,0,0,0,0,0], "i8", ALLOC_STATIC)+8, 0], "i32", ALLOC_STATIC);

  var ___dso_handle=allocate(1, "i32*", ALLOC_STATIC);



FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);

var Math_min = Math.min;
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  try {
    Module["dynCall_viiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiiid(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiid"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiid(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiid"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    return Module["dynCall_iiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    Module["dynCall_viiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env.__ZTISt9exception|0;var p=env.___dso_handle|0;var q=env._stderr|0;var r=env._stdin|0;var s=env._stdout|0;var t=0;var u=0;var v=0;var w=0;var x=+env.NaN,y=+env.Infinity;var z=0,A=0,B=0,C=0,D=0.0,E=0,F=0,G=0,H=0.0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=0;var Q=0;var R=0;var S=global.Math.floor;var T=global.Math.abs;var U=global.Math.sqrt;var V=global.Math.pow;var W=global.Math.cos;var X=global.Math.sin;var Y=global.Math.tan;var Z=global.Math.acos;var _=global.Math.asin;var $=global.Math.atan;var aa=global.Math.atan2;var ba=global.Math.exp;var ca=global.Math.log;var da=global.Math.ceil;var ea=global.Math.imul;var fa=env.abort;var ga=env.assert;var ha=env.asmPrintInt;var ia=env.asmPrintFloat;var ja=env.min;var ka=env.invoke_iiii;var la=env.invoke_viiiiiii;var ma=env.invoke_viiiii;var na=env.invoke_vi;var oa=env.invoke_vii;var pa=env.invoke_viiiiiiiii;var qa=env.invoke_ii;var ra=env.invoke_viiiiiid;var sa=env.invoke_viii;var ta=env.invoke_viiiiid;var ua=env.invoke_v;var va=env.invoke_iiiiiiiii;var wa=env.invoke_iiiii;var xa=env.invoke_viiiiiiii;var ya=env.invoke_viiiiii;var za=env.invoke_iii;var Aa=env.invoke_iiiiii;var Ba=env.invoke_viiii;var Ca=env._fabs;var Da=env._vsscanf;var Ea=env.__ZSt9terminatev;var Fa=env.___cxa_guard_acquire;var Ga=env.__reallyNegative;var Ha=env.___assert_fail;var Ia=env.__ZSt18uncaught_exceptionv;var Ja=env._longjmp;var Ka=env.___ctype_toupper_loc;var La=env.__addDays;var Ma=env._sbrk;var Na=env.___cxa_begin_catch;var Oa=env._emscripten_memcpy_big;var Pa=env._sysconf;var Qa=env._fileno;var Ra=env._fread;var Sa=env._write;var Ta=env.__isLeapYear;var Ua=env.__ZNSt9exceptionD2Ev;var Va=env.___cxa_does_inherit;var Wa=env.__exit;var Xa=env.___cxa_rethrow;var Ya=env._catclose;var Za=env._send;var _a=env.___cxa_is_number_type;var $a=env.___cxa_free_exception;var ab=env.___cxa_find_matching_catch;var bb=env._isxdigit_l;var cb=env.___cxa_guard_release;var db=env._strtol;var eb=env.___setErrNo;var fb=env._newlocale;var gb=env._isdigit_l;var hb=env.___resumeException;var ib=env._freelocale;var jb=env._putchar;var kb=env._sprintf;var lb=env._vasprintf;var mb=env._vsnprintf;var nb=env._strtoull_l;var ob=env._read;var pb=env._fwrite;var qb=env._time;var rb=env._fprintf;var sb=env._catopen;var tb=env._exit;var ub=env.___ctype_b_loc;var vb=env._fmod;var wb=env.___cxa_allocate_exception;var xb=env._strtoll;var yb=env._pwrite;var zb=env._uselocale;var Ab=env._snprintf;var Bb=env.__scanString;var Cb=env.___cxa_end_catch;var Db=env._strtoull;var Eb=env._strftime;var Fb=env._isxdigit;var Gb=env.__parseInt;var Hb=env._pthread_cond_broadcast;var Ib=env._recv;var Jb=env._fgetc;var Kb=env.__parseInt64;var Lb=env.__getFloat;var Mb=env._abort;var Nb=env._ceil;var Ob=env._isspace;var Pb=env._pthread_cond_wait;var Qb=env._ungetc;var Rb=env._fflush;var Sb=env._strftime_l;var Tb=env._pthread_mutex_lock;var Ub=env._sscanf;var Vb=env._catgets;var Wb=env._asprintf;var Xb=env._strtoll_l;var Yb=env.__arraySum;var Zb=env.___ctype_tolower_loc;var _b=env._pthread_mutex_unlock;var $b=env._pread;var ac=env._mkport;var bc=env.___errno_location;var cc=env._copysign;var dc=env._fputc;var ec=env.___cxa_throw;var fc=env._isdigit;var gc=env._strerror;var hc=env._emscripten_longjmp;var ic=env.__formatString;var jc=env._atexit;var kc=env._strerror_r;var lc=0.0;
// EMSCRIPTEN_START_FUNCS
function Ec(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function Fc(){return i|0}function Gc(a){a=a|0;i=a}function Hc(a,b){a=a|0;b=b|0;if((t|0)==0){t=a;u=b}}function Ic(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function Jc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function Kc(a){a=a|0;I=a}function Lc(a){a=a|0;J=a}function Mc(a){a=a|0;K=a}function Nc(a){a=a|0;L=a}function Oc(a){a=a|0;M=a}function Pc(a){a=a|0;N=a}function Qc(a){a=a|0;O=a}function Rc(a){a=a|0;P=a}function Sc(a){a=a|0;Q=a}function Tc(a){a=a|0;R=a}function Uc(b){b=b|0;var d=0;d=i;Ud(b+308|0);Ud(b+296|0);if(!((a[b+272|0]&1)==0)){jr(c[b+280>>2]|0)}xd(b+136|0);xd(b);i=d;return}function Vc(a){a=a|0;Na(a|0)|0;Ea()}function Wc(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;j=i;i=i+32|0;g=j+12|0;h=j;if(e>>>0>4294967279){Ii(0)}if(e>>>0<11){a[g]=e<<1;k=g+1|0}else{l=e+16&-16;k=hr(l)|0;c[g+8>>2]=k;c[g>>2]=l|1;c[g+4>>2]=e}Fr(k|0,d|0,e|0)|0;a[k+e|0]=0;c[h+0>>2]=0;c[h+4>>2]=0;c[h+8>>2]=0;Ag(b+4|0,g,h)|0;e=f+4|0;b=c[e>>2]|0;if((b|0)==(c[f+8>>2]|0)){vd(f,h)}else{do{if((b|0)!=0){if((a[h]&1)==0){c[b+0>>2]=c[h+0>>2];c[b+4>>2]=c[h+4>>2];c[b+8>>2]=c[h+8>>2];break}f=c[h+8>>2]|0;k=c[h+4>>2]|0;if(k>>>0>4294967279){Ii(0)}if(k>>>0<11){a[b]=k<<1;b=b+1|0}else{d=k+16&-16;l=hr(d)|0;c[b+8>>2]=l;c[b>>2]=d|1;c[b+4>>2]=k;b=l}Fr(b|0,f|0,k|0)|0;a[b+k|0]=0}}while(0);c[e>>2]=(c[e>>2]|0)+12}if(!((a[h]&1)==0)){jr(c[h+8>>2]|0)}if((a[g]&1)==0){i=j;return 1}jr(c[g+8>>2]|0);i=j;return 1}function Xc(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;i=i+32|0;h=g+12|0;j=g;if(e>>>0>4294967279){Ii(0)}if(e>>>0<11){a[h]=e<<1;k=h+1|0}else{l=e+16&-16;k=hr(l)|0;c[h+8>>2]=k;c[h>>2]=l|1;c[h+4>>2]=e}Fr(k|0,d|0,e|0)|0;a[k+e|0]=0;c[j+0>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0;Bg(b+4|0,h,j)|0;Pi(f,j)|0;if(!((a[j]&1)==0)){jr(c[j+8>>2]|0)}if((a[h]&1)==0){i=g;return 1}jr(c[h+8>>2]|0);i=g;return 1}function Yc(a,b){a=a|0;b=b|0;return 1}function Zc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;g=i;i=i+16|0;h=g;f=b+328|0;if(e>>>0>4294967279){Ii(0)}if(e>>>0<11){a[h]=e<<1;j=h+1|0}else{k=e+16&-16;j=hr(k)|0;c[h+8>>2]=j;c[h>>2]=k|1;c[h+4>>2]=e}Fr(j|0,d|0,e|0)|0;a[j+e|0]=0;Pi(f,h)|0;if((a[h]&1)==0){k=b+4|0;zg(k,f)|0;i=g;return 1}jr(c[h+8>>2]|0);k=b+4|0;zg(k,f)|0;i=g;return 1}function _c(a,b,c){a=a|0;b=b|0;c=c|0;return 1}function $c(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+96|0;m=f+88|0;h=f+40|0;j=f+24|0;l=f+12|0;k=f;c[h+12>>2]=0;ud(h+16|0,0,1024);c[h+40>>2]=0;c[h+44>>2]=0;if(e>>>0>4294967279){Ii(0)}if(e>>>0<11){n=e<<1&255;a[j]=n;g=j;o=j+1|0}else{n=e+16&-16;o=hr(n)|0;c[j+8>>2]=o;n=n|1;c[j>>2]=n;c[j+4>>2]=e;g=j;n=n&255}Fr(o|0,d|0,e|0)|0;a[o+e|0]=0;if((n&1)==0){e=j+1|0}else{e=c[j+8>>2]|0}c[m>>2]=e;c[m+4>>2]=e;if((c[(fd(h,m)|0)+40>>2]|0)==0){m=ad(h,56)|0;if((c[m+12>>2]&1048576|0)==0){Ha(288,224,447,304)}e=c[m>>2]|0;d=Cr(e|0)|0;if(d>>>0>4294967279){Ii(0)}if(d>>>0<11){a[l]=d<<1;m=l+1|0}else{o=d+16&-16;m=hr(o)|0;c[l+8>>2]=m;c[l>>2]=o|1;c[l+4>>2]=d}Fr(m|0,e|0,d|0)|0;a[m+d|0]=0;m=ad(h,72)|0;if((c[m+12>>2]&1024|0)==0){Ha(200,224,422,280)}m=c[m>>2]|0;e=ad(h,96)|0;if((c[e+12>>2]&1048576|0)==0){Ha(288,224,447,304)}n=c[e>>2]|0;d=Cr(n|0)|0;if(d>>>0>4294967279){Ii(0)}if(d>>>0<11){a[k]=d<<1;e=k+1|0}else{o=d+16&-16;e=hr(o)|0;c[k+8>>2]=e;c[k>>2]=o|1;c[k+4>>2]=d}Fr(e|0,n|0,d|0)|0;a[e+d|0]=0;e=ad(h,112)|0;if((c[e+12>>2]&1024|0)==0){Ha(200,224,422,280)}o=c[e>>2]|0;n=b+4|0;zg(n,b+328|0)|0;wg(n,l,m,k,o)|0;if(!((a[k]&1)==0)){jr(c[k+8>>2]|0)}if((a[l]&1)==0){k=1}else{jr(c[l+8>>2]|0);k=1}}else{k=0}if(!((a[g]&1)==0)){jr(c[j+8>>2]|0)}g=c[h+20>>2]|0;if((g|0)==0){i=f;return k|0}h=g+8|0;j=c[g>>2]|0;a:do{if((j|0)!=0){while(1){if((j|0)==(c[h>>2]|0)){break a}b=c[j+8>>2]|0;dr(j);c[g>>2]=b;if((b|0)==0){break}else{j=b}}}}while(0);h=c[g+16>>2]|0;if((h|0)!=0){jr(h)}jr(g);i=f;return k|0}function ad(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;if((d|0)==0){Ha(344,224,619,352)}if((c[b+12>>2]|0)==3){f=d}else{Ha(368,224,620,352)}while(1){if((a[f]|0)==0){break}else{f=f+1|0}}f=f-d|0;g=c[b+4>>2]|0;a:do{if((g|0)!=0){h=c[b>>2]|0;b=h+(g<<5)|0;g=h;while(1){if((f|0)==(c[g+4>>2]|0)?(yr(c[g>>2]|0,d,f)|0)==0:0){break}g=g+32|0;if((g|0)==(b|0)){break a}}if((g|0)!=0){h=g+16|0;i=e;return h|0}}}while(0);if((a[336]|0)!=0){h=320;i=e;return h|0}if((Fa(336)|0)==0){h=320;i=e;return h|0}c[332>>2]=0;cb(336);h=320;i=e;return h|0}function bd(){var a=0,b=0,d=0,e=0,f=0,g=0;b=i;d=c[1788]|0;if((d|0)>0){e=0}else{g=-1;i=b;return g|0}while(1){f=7160+(e<<2)|0;g=e+1|0;if((c[f>>2]|0)==0){break}if((g|0)<(d|0)){e=g}else{d=-1;a=5;break}}if((a|0)==5){i=b;return d|0}g=hr(340)|0;c[g>>2]=16;vg(g+4|0);d=g+328|0;c[d+0>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;c[f>>2]=g;g=e;i=b;return g|0}function cd(b){b=b|0;var d=0;d=i;c[b>>2]=16;if(!((a[b+328|0]&1)==0)){jr(c[b+336>>2]|0)}Uc(b+4|0);i=d;return}function dd(b){b=b|0;var d=0;d=i;c[b>>2]=16;if(!((a[b+328|0]&1)==0)){jr(c[b+336>>2]|0)}Ud(b+312|0);Ud(b+300|0);if(!((a[b+276|0]&1)==0)){jr(c[b+284>>2]|0)}xd(b+140|0);xd(b+4|0);jr(b);i=d;return}function ed(a,b){a=a|0;b=b|0;return 0}function fd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+192|0;e=d;if((a|0)!=0){c[a+12>>2]=0}ud(e,0,256);f=e+180|0;c[f>>2]=0;g=e+184|0;c[g>>2]=0;do{if(gd(e,b,a)|0){f=a+28|0;b=c[f>>2]|0;if((b-(c[a+24>>2]|0)|0)==16){g=b+ -16|0;c[f>>2]=g;c[a+0>>2]=c[g+0>>2];c[a+4>>2]=c[g+4>>2];c[a+8>>2]=c[g+8>>2];c[a+12>>2]=c[g+12>>2];c[b+ -4>>2]=0;c[a+40>>2]=0;c[a+44>>2]=0;break}else{Ha(384,224,713,424)}}else{c[a+40>>2]=c[f>>2];c[a+44>>2]=c[g>>2];c[a+28>>2]=c[a+24>>2]}}while(0);e=c[e+4>>2]|0;if((e|0)==0){i=d;return a|0}f=e+8|0;g=c[e>>2]|0;a:do{if((g|0)!=0){while(1){if((g|0)==(c[f>>2]|0)){break a}b=c[g+8>>2]|0;dr(g);c[e>>2]=b;if((b|0)==0){break}else{g=b}}}}while(0);f=c[e+16>>2]|0;if((f|0)!=0){jr(f)}jr(e);i=d;return a|0}function gd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;g=i;i=i+168|0;c[g>>2]=0;h=b+180|0;c[h>>2]=0;j=b+184|0;c[j>>2]=0;k=b+24|0;Dr(k,1,g|0)|0;t=0;l=t;t=0;if((l|0)!=0&(u|0)!=0){m=Er(c[l>>2]|0,g)|0;if((m|0)==0){Ja(l|0,u|0)}I=u}else{m=-1}if((m|0)==1){l=I}else{l=0}while(1){if((l|0)!=0){g=4;break}l=d;m=c[l+4>>2]|0;l=c[l>>2]|0;while(1){n=a[l]|0;if(!(n<<24>>24==9|n<<24>>24==13|n<<24>>24==10|n<<24>>24==32)){break}l=l+1|0}n=d;c[n>>2]=l;c[n+4>>2]=m;l=a[l]|0;if(l<<24>>24==0){c[h>>2]=544;c[j>>2]=(c[d>>2]|0)-(c[d+4>>2]|0);t=0;oa(40,k|0,1);l=t;t=0;if((l|0)!=0&(u|0)!=0){m=Er(c[l>>2]|0,g)|0;if((m|0)==0){Ja(l|0,u|0)}I=u}else{m=-1}if((m|0)==1){l=I;continue}else{g=10;break}}l=l<<24>>24;if((l|0)==123){t=0;sa(3,b|0,d|0,e|0);l=t;t=0;if((l|0)!=0&(u|0)!=0){m=Er(c[l>>2]|0,g)|0;if((m|0)==0){Ja(l|0,u|0)}I=u}else{m=-1}if((m|0)==1){l=I;continue}}else if((l|0)==91){t=0;sa(4,b|0,d|0,e|0);m=t;t=0;if((m|0)!=0&(u|0)!=0){l=Er(c[m>>2]|0,g)|0;if((l|0)==0){Ja(m|0,u|0)}I=u}else{l=-1}if((l|0)==1){l=I;continue}}else{c[h>>2]=584;c[j>>2]=(c[d>>2]|0)-(c[d+4>>2]|0);t=0;oa(40,k|0,1);m=t;t=0;if((m|0)!=0&(u|0)!=0){l=Er(c[m>>2]|0,g)|0;if((l|0)==0){Ja(m|0,u|0)}I=u}else{l=-1}if((l|0)==1){l=I;continue}else{g=17;break}}l=d;m=c[l+4>>2]|0;l=c[l>>2]|0;while(1){n=a[l]|0;if(!(n<<24>>24==9|n<<24>>24==13|n<<24>>24==10|n<<24>>24==32)){break}l=l+1|0}n=d;c[n>>2]=l;c[n+4>>2]=m;if((a[l]|0)==0){b=1;g=24;break}c[h>>2]=632;c[j>>2]=(c[d>>2]|0)-(c[d+4>>2]|0);t=0;oa(40,k|0,1);l=t;t=0;if((l|0)!=0&(u|0)!=0){m=Er(c[l>>2]|0,g)|0;if((m|0)==0){Ja(l|0,u|0)}I=u}else{m=-1}if((m|0)==1){l=I}else{g=23;break}}if((g|0)==4){c[b+12>>2]=c[b+8>>2];n=0;i=f;return n|0}else if((g|0)!=10)if((g|0)!=17)if((g|0)!=23)if((g|0)==24){i=f;return b|0}return 0}function hd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;g=c[d>>2]|0;if((a[g]|0)!=123){Ha(6928,704,264,6952)}c[d>>2]=g+1;g=e+28|0;o=c[g>>2]|0;j=e+32|0;if(!((o+16|0)>>>0<(c[j>>2]|0)>>>0)){m=e+36|0;l=c[m>>2]|0;h=l<<1;n=e+24|0;k=c[n>>2]|0;o=o-k|0;p=o+16|0;p=h>>>0<p>>>0?p:h;l=qd(c[e+16>>2]|0,k,l,p)|0;c[n>>2]=l;c[m>>2]=p;o=l+o|0;c[g>>2]=o;c[j>>2]=l+p}c[g>>2]=o+16;if((o|0)!=0){c[o+12>>2]=3;c[o+0>>2]=0;c[o+4>>2]=0;c[o+8>>2]=0}g=d;h=c[g+4>>2]|0;g=c[g>>2]|0;while(1){p=a[g]|0;if(!(p<<24>>24==9|p<<24>>24==13|p<<24>>24==10|p<<24>>24==32)){break}g=g+1|0}p=d;c[p>>2]=g;c[p+4>>2]=h;h=a[g]|0;if(h<<24>>24==34){g=1;while(1){od(b,d,e);h=d;j=c[h+4>>2]|0;h=c[h>>2]|0;while(1){p=a[h]|0;if(!(p<<24>>24==9|p<<24>>24==13|p<<24>>24==10|p<<24>>24==32)){break}h=h+1|0}p=d;c[p>>2]=h;c[p+4>>2]=j;c[d>>2]=h+1;if((a[h]|0)!=58){h=17;break}j=d;h=c[j+4>>2]|0;j=c[j>>2]|0;while(1){p=a[j]|0;if(!(p<<24>>24==9|p<<24>>24==13|p<<24>>24==10|p<<24>>24==32)){break}j=j+1|0}p=d;c[p>>2]=j;c[p+4>>2]=h;kd(b,d,e);j=d;h=c[j+4>>2]|0;j=c[j>>2]|0;while(1){p=a[j]|0;if(!(p<<24>>24==9|p<<24>>24==13|p<<24>>24==10|p<<24>>24==32)){break}j=j+1|0}p=d;c[p>>2]=j;c[p+4>>2]=h;c[d>>2]=j+1;h=a[j]|0;if((h|0)==125){h=29;break}else if((h|0)!=44){h=30;break}j=d;h=c[j+4>>2]|0;j=c[j>>2]|0;while(1){p=a[j]|0;if(!(p<<24>>24==9|p<<24>>24==13|p<<24>>24==10|p<<24>>24==32)){break}j=j+1|0}p=d;c[p>>2]=j;c[p+4>>2]=h;if((a[j]|0)==34){g=g+1|0}else{h=12;break}}if((h|0)==12){p=b+180|0;c[p>>2]=6968;p=c[d>>2]|0;o=d+4|0;o=c[o>>2]|0;o=p-o|0;p=b+184|0;c[p>>2]=o;p=b+24|0;Ja(p|0,1)}else if((h|0)==17){c[b+180>>2]=7016;c[b+184>>2]=(c[d>>2]|0)-(c[d+4>>2]|0);Ja(b+24|0,1)}else if((h|0)==29){td(e,g);i=f;return}else if((h|0)==30){c[b+180>>2]=7072;c[b+184>>2]=(c[d>>2]|0)-(c[d+4>>2]|0);Ja(b+24|0,1)}}else if(h<<24>>24==125){c[d>>2]=g+1;td(e,0);i=f;return}else{p=b+180|0;c[p>>2]=6968;p=c[d>>2]|0;o=d+4|0;o=c[o>>2]|0;o=p-o|0;p=b+184|0;c[p>>2]=o;p=b+24|0;Ja(p|0,1)}}function id(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;h=c[d>>2]|0;if((a[h]|0)!=91){Ha(680,704,306,760)}c[d>>2]=h+1;h=e+28|0;p=c[h>>2]|0;l=e+32|0;if(!((p+16|0)>>>0<(c[l>>2]|0)>>>0)){o=e+36|0;m=c[o>>2]|0;j=m<<1;n=e+24|0;k=c[n>>2]|0;p=p-k|0;q=p+16|0;q=j>>>0<q>>>0?q:j;m=qd(c[e+16>>2]|0,k,m,q)|0;c[n>>2]=m;c[o>>2]=q;p=m+p|0;c[h>>2]=p;c[l>>2]=m+q}c[h>>2]=p+16;if((p|0)!=0){c[p+12>>2]=4;c[p+0>>2]=0;c[p+4>>2]=0;c[p+8>>2]=0}h=d;j=c[h+4>>2]|0;h=c[h>>2]|0;while(1){q=a[h]|0;if(!(q<<24>>24==9|q<<24>>24==13|q<<24>>24==10|q<<24>>24==32)){break}h=h+1|0}q=d;c[q>>2]=h;c[q+4>>2]=j;if((a[h]|0)==93){c[d>>2]=h+1;jd(e,0);i=g;return}else{h=1}while(1){kd(b,d,e);k=d;j=c[k+4>>2]|0;k=c[k>>2]|0;while(1){q=a[k]|0;if(!(q<<24>>24==9|q<<24>>24==13|q<<24>>24==10|q<<24>>24==32)){break}k=k+1|0}q=d;c[q>>2]=k;c[q+4>>2]=j;c[d>>2]=k+1;j=a[k]|0;if((j|0)==93){break}else if((j|0)!=44){f=21;break}j=d;k=c[j+4>>2]|0;j=c[j>>2]|0;while(1){q=a[j]|0;if(!(q<<24>>24==9|q<<24>>24==13|q<<24>>24==10|q<<24>>24==32)){break}j=j+1|0}q=d;c[q>>2]=j;c[q+4>>2]=k;h=h+1|0}if((f|0)==21){c[b+180>>2]=776;c[b+184>>2]=(c[d>>2]|0)-(c[d+4>>2]|0);Ja(b+24|0,1)}jd(e,h);i=g;return}function jd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;j=a+28|0;d=c[j>>2]|0;h=c[a+24>>2]|0;f=b<<4;if((d-h|0)>>>0<f>>>0){Ha(440,472,52,536)}g=d+(0-f)|0;c[j>>2]=g;if(!((g-h|0)>>>0>15)){Ha(6896,472,59,6920)}h=-16-f|0;j=c[a+16>>2]|0;c[d+(h|12)>>2]=4;a=c[j>>2]|0;k=c[a+4>>2]|0;if((k+f|0)>>>0>(c[a>>2]|0)>>>0){k=c[j+4>>2]|0;l=k>>>0>f>>>0?k:f;k=cr(l+12|0)|0;c[k>>2]=l;c[k+4>>2]=0;c[k+8>>2]=a;c[j>>2]=k;a=k;k=0}j=a+12+k|0;if((j&3|0)==0){c[a+4>>2]=k+f;c[d+h>>2]=j;Fr(j|0,g|0,f|0)|0;c[d+(h|8)>>2]=b;c[d+(h|4)>>2]=b;i=e;return}else{Ha(1080,1e3,242,1112)}}function kd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=i;switch(a[c[d>>2]|0]|0){case 102:{nd(b,d,e);i=f;return};case 91:{id(b,d,e);i=f;return};case 116:{md(b,d,e);i=f;return};case 110:{ld(b,d,e);i=f;return};case 34:{od(b,d,e);i=f;return};case 123:{hd(b,d,e);i=f;return};default:{pd(b,d,e);i=f;return}}}function ld(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;j=c[d>>2]|0;if((a[j]|0)!=110){Ha(6856,704,332,6880)}g=j+2|0;c[d>>2]=g;if(((a[j+1|0]|0)==117?(h=j+3|0,c[d>>2]=h,(a[g]|0)==108):0)?(c[d>>2]=j+4,(a[h]|0)==108):0){g=e+28|0;m=c[g>>2]|0;l=e+32|0;if(!((m+16|0)>>>0<(c[l>>2]|0)>>>0)){b=e+36|0;h=c[b>>2]|0;j=h<<1;d=e+24|0;k=c[d>>2]|0;m=m-k|0;n=m+16|0;n=j>>>0<n>>>0?n:j;k=qd(c[e+16>>2]|0,k,h,n)|0;c[d>>2]=k;c[b>>2]=n;m=k+m|0;c[g>>2]=m;c[l>>2]=k+n}c[g>>2]=m+16;if((m|0)==0){i=f;return}c[m+12>>2]=0;i=f;return}c[b+180>>2]=6800;c[b+184>>2]=(c[d>>2]|0)+ -1-(c[d+4>>2]|0);Ja(b+24|0,1)}function md(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;j=c[d>>2]|0;if((a[j]|0)!=116){Ha(6816,704,343,6840)}g=j+2|0;c[d>>2]=g;if(((a[j+1|0]|0)==114?(h=j+3|0,c[d>>2]=h,(a[g]|0)==117):0)?(c[d>>2]=j+4,(a[h]|0)==101):0){g=e+28|0;m=c[g>>2]|0;l=e+32|0;if(!((m+16|0)>>>0<(c[l>>2]|0)>>>0)){b=e+36|0;h=c[b>>2]|0;j=h<<1;d=e+24|0;k=c[d>>2]|0;m=m-k|0;n=m+16|0;n=j>>>0<n>>>0?n:j;k=qd(c[e+16>>2]|0,k,h,n)|0;c[d>>2]=k;c[b>>2]=n;m=k+m|0;c[g>>2]=m;c[l>>2]=k+n}c[g>>2]=m+16;if((m|0)==0){i=f;return}c[m+12>>2]=258;i=f;return}c[b+180>>2]=6800;c[b+184>>2]=(c[d>>2]|0)-(c[d+4>>2]|0);Ja(b+24|0,1)}function nd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;k=c[d>>2]|0;if((a[k]|0)!=102){Ha(6760,704,354,6784)}g=k+2|0;c[d>>2]=g;if((((a[k+1|0]|0)==97?(h=k+3|0,c[d>>2]=h,(a[g]|0)==108):0)?(j=k+4|0,c[d>>2]=j,(a[h]|0)==115):0)?(c[d>>2]=k+5,(a[j]|0)==101):0){g=e+28|0;m=c[g>>2]|0;b=e+32|0;if(!((m+16|0)>>>0<(c[b>>2]|0)>>>0)){d=e+36|0;h=c[d>>2]|0;k=h<<1;j=e+24|0;l=c[j>>2]|0;m=m-l|0;n=m+16|0;n=k>>>0<n>>>0?n:k;l=qd(c[e+16>>2]|0,l,h,n)|0;c[j>>2]=l;c[d>>2]=n;m=l+m|0;c[g>>2]=m;c[b>>2]=l+n}c[g>>2]=m+16;if((m|0)==0){i=f;return}c[m+12>>2]=257;i=f;return}c[b+180>>2]=6800;c[b+184>>2]=(c[d>>2]|0)+ -1-(c[d+4>>2]|0);Ja(b+24|0,1)}function od(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;j=i;i=i+16|0;n=j;k=d;f=c[k+4>>2]|0;k=c[k>>2]|0;if((a[k]|0)!=34){Ha(6400,704,399,6424)}g=b+12|0;m=b+16|0;l=b+20|0;h=b+8|0;o=n;q=k+1|0;k=0;a:while(1){p=q+1|0;r=a[q]|0;if(r<<24>>24==34){n=37;break}else if(r<<24>>24==0){n=42;break}else if(!(r<<24>>24==92)){if((r&255)<32){n=44;break}u=c[g>>2]|0;if(!((u+1|0)>>>0<(c[m>>2]|0)>>>0)){s=c[l>>2]|0;q=s<<1;t=c[h>>2]|0;v=u-t|0;u=v+1|0;q=q>>>0<u>>>0?u:q;t=qd(c[b>>2]|0,t,s,q)|0;c[h>>2]=t;c[l>>2]=q;u=t+v|0;c[g>>2]=u;c[m>>2]=t+q}c[g>>2]=u+1;a[u]=r;q=p;k=k+1|0;continue}q=q+2|0;r=a[p]|0;p=a[6144+(r&255)|0]|0;if(!(p<<24>>24==0)){u=c[g>>2]|0;if(!((u+1|0)>>>0<(c[m>>2]|0)>>>0)){r=c[l>>2]|0;s=r<<1;t=c[h>>2]|0;v=u-t|0;u=v+1|0;s=s>>>0<u>>>0?u:s;t=qd(c[b>>2]|0,t,r,s)|0;c[h>>2]=t;c[l>>2]=s;u=t+v|0;c[g>>2]=u;c[m>>2]=t+s}c[g>>2]=u+1;a[u]=p;k=k+1|0;continue}if(r<<24>>24==117){r=q;p=0;s=0}else{n=36;break}while(1){q=r+1|0;t=a[r]|0;p=(t<<24>>24)+(p<<4)|0;do{if((t+ -48<<24>>24&255)<10){p=p+ -48|0}else{if((t+ -65<<24>>24&255)<6){p=p+ -55|0;break}if(!((t+ -97<<24>>24&255)<6)){n=16;break a}p=p+ -87|0}}while(0);s=s+1|0;if((s|0)>=4){break}else{r=q}}if((p+ -55296|0)>>>0<1024){s=r+2|0;if((a[q]|0)!=92){t=s;n=21;break}t=r+3|0;if((a[s]|0)==117){s=0;r=0}else{n=21;break}while(1){q=t+1|0;t=a[t]|0;s=(t<<24>>24)+(s<<4)|0;do{if((t+ -48<<24>>24&255)<10){s=s+ -48|0}else{if((t+ -65<<24>>24&255)<6){s=s+ -55|0;break}if(!((t+ -97<<24>>24&255)<6)){n=28;break a}s=s+ -87|0}}while(0);r=r+1|0;if((r|0)<4){t=q}else{break}}r=s+ -56320|0;if(r>>>0>1023){n=31;break}p=(r|(p<<10)+ -56623104)+65536|0}p=(rd(n,p)|0)-o|0;u=c[g>>2]|0;if(!((u+p|0)>>>0<(c[m>>2]|0)>>>0)){r=c[l>>2]|0;s=r<<1;t=c[h>>2]|0;u=u-t|0;v=u+p|0;v=s>>>0<v>>>0?v:s;t=qd(c[b>>2]|0,t,r,v)|0;c[h>>2]=t;c[l>>2]=v;u=t+u|0;c[g>>2]=u;c[m>>2]=t+v}c[g>>2]=u+p;Fr(u|0,n|0,p|0)|0;k=p+k|0}if((n|0)==16){c[b+180>>2]=6720;c[b+184>>2]=q+~f;Ja(b+24|0,1)}else if((n|0)==21){c[b+180>>2]=6440;c[b+184>>2]=-2-f+t;Ja(b+24|0,1)}else if((n|0)==28){c[b+180>>2]=6720;c[b+184>>2]=q+~f;Ja(b+24|0,1)}else if((n|0)==31){c[b+180>>2]=6480;c[b+184>>2]=-2-f+q;Ja(b+24|0,1)}else if((n|0)==36){c[b+180>>2]=6528;c[b+184>>2]=(c[d>>2]|0)+ -1-(c[d+4>>2]|0);Ja(b+24|0,1)}else if((n|0)==37){r=c[g>>2]|0;if(!((r+1|0)>>>0<(c[m>>2]|0)>>>0)){q=c[l>>2]|0;n=q<<1;o=c[h>>2]|0;s=r-o|0;r=s+1|0;v=n>>>0<r>>>0?r:n;u=qd(c[b>>2]|0,o,q,v)|0;c[h>>2]=u;c[l>>2]=v;r=u+s|0;c[g>>2]=r;c[m>>2]=u+v}c[g>>2]=r+1;a[r]=0;b=c[g>>2]|0;if((b-(c[h>>2]|0)|0)>>>0<(k+1|0)>>>0){Ha(440,472,52,536)}else{v=b+~k|0;c[g>>2]=v;sd(e,v,k,1);v=d;c[v>>2]=p;c[v+4>>2]=f;i=j;return}}else if((n|0)==42){c[b+180>>2]=6560;c[b+184>>2]=(c[d>>2]|0)+ -1-(c[d+4>>2]|0);Ja(b+24|0,1)}else if((n|0)==44){c[b+180>>2]=6608;c[b+184>>2]=(c[d>>2]|0)+ -1-(c[d+4>>2]|0);Ja(b+24|0,1)}}function pd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,l=0,m=0.0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0.0,v=0,w=0,x=0,y=0,z=0,A=0,B=0.0;g=i;w=d;f=c[w+4>>2]|0;w=c[w>>2]|0;l=(a[w]|0)==45;x=l?w+1|0:w;w=a[x]|0;a:do{if(!(w<<24>>24==48)){if(!((w+ -49<<24>>24&255)<9)){c[b+180>>2]=824;c[b+184>>2]=(c[d>>2]|0)-(c[d+4>>2]|0);Ja(b+24|0,1)}z=x+1|0;w=(w<<24>>24)+ -48|0;A=a[z]|0;x=(A+ -48<<24>>24&255)<10;b:do{if(l){if(!x){v=A;p=0;o=0;s=z;u=0.0;q=w;r=0;t=0;break a}while(1){if(w>>>0>214748363){if((w|0)!=214748364){break b}if(A<<24>>24>56){w=214748364;break b}}z=z+1|0;w=(w*10|0)+ -48+(A<<24>>24)|0;A=a[z]|0;if(!((A+ -48<<24>>24&255)<10)){v=A;p=0;o=0;s=z;u=0.0;q=w;r=0;t=0;break a}}}else{if(!x){v=A;p=0;o=0;s=z;u=0.0;q=w;r=0;t=0;break a}while(1){if(w>>>0>429496728){if((w|0)!=429496729){break b}if(A<<24>>24>53){w=429496729;break b}}z=z+1|0;w=(w*10|0)+ -48+(A<<24>>24)|0;A=a[z]|0;if(!((A+ -48<<24>>24&255)<10)){v=A;p=0;o=0;s=z;u=0.0;q=w;r=0;t=0;break a}}}}while(0);x=(A+ -48<<24>>24&255)<10;c:do{if(l){if(x){x=0;y=w}else{v=A;p=0;o=w;s=z;u=0.0;q=w;r=1;t=0;break a}while(1){if(x>>>0>214748364|(x|0)==214748364&y>>>0>3435973835){if(!((y|0)==-858993460&(x|0)==214748364)){break c}if(A<<24>>24>56){x=214748364;y=-858993460;break c}}y=Qr(y|0,x|0,10,0)|0;z=z+1|0;x=(A<<24>>24)+ -48|0;y=Br(x|0,((x|0)<0)<<31>>31|0,y|0,I|0)|0;x=I;A=a[z]|0;if(!((A+ -48<<24>>24&255)<10)){v=A;p=x;o=y;s=z;u=0.0;q=w;r=1;t=0;break a}}}else{if(x){x=0;y=w}else{v=A;p=0;o=w;s=z;u=0.0;q=w;r=1;t=0;break a}while(1){if(x>>>0>429496729|(x|0)==429496729&y>>>0>2576980376){if(!((y|0)==-1717986919&(x|0)==429496729)){break c}if(A<<24>>24>53){x=429496729;y=-1717986919;break c}}y=Qr(y|0,x|0,10,0)|0;z=z+1|0;x=(A<<24>>24)+ -48|0;y=Br(x|0,((x|0)<0)<<31>>31|0,y|0,I|0)|0;x=I;A=a[z]|0;if(!((A+ -48<<24>>24&255)<10)){v=A;p=x;o=y;s=z;u=0.0;q=w;r=1;t=0;break a}}}}while(0);B=+(y>>>0)+4294967296.0*+(x>>>0);if((A+ -48<<24>>24&255)<10){while(1){if(B>=1.0e+307){break}z=z+1|0;B=B*10.0+ +((A<<24>>24)+ -48|0);A=a[z]|0;if(!((A+ -48<<24>>24&255)<10)){v=A;p=x;o=y;s=z;u=B;q=w;r=1;t=1;break a}}c[b+180>>2]=848;c[b+184>>2]=(c[d>>2]|0)-(c[d+4>>2]|0);Ja(b+24|0,1)}else{v=A;p=x;o=y;s=z;u=B;q=w;r=1;t=1}}else{s=x+1|0;v=a[s]|0;p=0;o=0;u=0.0;q=0;r=0;t=0}}while(0);if(v<<24>>24==46){do{if(!t){if(r){u=+(o>>>0)+4294967296.0*+(p>>>0);break}else{u=+(q>>>0);break}}}while(0);t=a[s+1|0]|0;if(!((t+ -48<<24>>24&255)<10)){c[b+180>>2]=888;c[b+184>>2]=(c[d>>2]|0)-(c[d+4>>2]|0);Ja(b+24|0,1)}s=s+2|0;u=u*10.0+ +((t<<24>>24)+ -48|0);v=a[s]|0;if((v+ -48<<24>>24&255)<10){w=-1;while(1){if((w|0)>-16){u=u*10.0+ +((v<<24>>24)+ -48|0);w=w+ -1|0}s=s+1|0;v=a[s]|0;if(!((v+ -48<<24>>24&255)<10)){t=1;break}}}else{w=-1;t=1}}else{w=0}do{if(v<<24>>24==69|v<<24>>24==101){do{if(!t){if(r){u=+(o>>>0)+4294967296.0*+(p>>>0);break}else{u=+(q>>>0);break}}}while(0);p=s+1|0;o=a[p]|0;if(o<<24>>24==43){p=s+2|0;o=0}else if(o<<24>>24==45){p=s+2|0;o=1}else{o=0}q=a[p]|0;if(!((q+ -48<<24>>24&255)<10)){c[b+180>>2]=928;c[b+184>>2]=p-f;Ja(b+24|0,1)}q=(q<<24>>24)+ -48|0;while(1){p=p+1|0;r=a[p]|0;if(!((r+ -48<<24>>24&255)<10)){r=56;break}q=(q*10|0)+ -48+(r<<24>>24)|0;if((q|0)>308){r=54;break}}if((r|0)==54){c[b+180>>2]=848;c[b+184>>2]=(c[d>>2]|0)-(c[d+4>>2]|0);Ja(b+24|0,1)}else if((r|0)==56){j=p;m=u;n=o?0-q|0:q;break}}else{if(!t){if(!r){if(l){j=0-q|0;l=e+28|0;t=c[l>>2]|0;o=e+32|0;if(!((t+16|0)>>>0<(c[o>>2]|0)>>>0)){p=e+36|0;b=c[p>>2]|0;n=b<<1;q=e+24|0;r=c[q>>2]|0;v=t-r|0;t=v+16|0;A=n>>>0<t>>>0?t:n;z=qd(c[e+16>>2]|0,r,b,A)|0;c[q>>2]=z;c[p>>2]=A;t=z+v|0;c[l>>2]=t;c[o>>2]=z+A}c[l>>2]=t+16;if((t|0)==0){y=s;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}e=t+12|0;c[e>>2]=5638;A=t;c[A>>2]=j;c[A+4>>2]=((j|0)<0)<<31>>31;if(!((j|0)>-1)){y=s;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}c[e>>2]=15878;y=s;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}else{j=e+28|0;t=c[j>>2]|0;r=e+32|0;if(!((t+16|0)>>>0<(c[r>>2]|0)>>>0)){l=e+36|0;o=c[l>>2]|0;b=o<<1;n=e+24|0;p=c[n>>2]|0;v=t-p|0;t=v+16|0;A=b>>>0<t>>>0?t:b;z=qd(c[e+16>>2]|0,p,o,A)|0;c[n>>2]=z;c[l>>2]=A;t=z+v|0;c[j>>2]=t;c[r>>2]=z+A}c[j>>2]=t+16;if((t|0)==0){y=s;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}e=t+12|0;c[e>>2]=14854;A=t;c[A>>2]=q;c[A+4>>2]=0;if((q|0)<0){y=s;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}c[e>>2]=15878;y=s;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}}if(!l){j=e+28|0;v=c[j>>2]|0;r=e+32|0;if(!((v+16|0)>>>0<(c[r>>2]|0)>>>0)){t=e+36|0;q=c[t>>2]|0;l=q<<1;b=e+24|0;n=c[b>>2]|0;w=v-n|0;v=w+16|0;A=l>>>0<v>>>0?v:l;z=qd(c[e+16>>2]|0,n,q,A)|0;c[b>>2]=z;c[t>>2]=A;v=z+w|0;c[j>>2]=v;c[r>>2]=z+A}c[j>>2]=v+16;if((v|0)==0){y=s;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}e=v+12|0;c[e>>2]=8710;A=v;c[A>>2]=o;c[A+4>>2]=p;if((p|0)<0){y=s;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}c[e>>2]=12806;if(p>>>0>0|(p|0)==0&o>>>0>4294967295){y=s;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}c[e>>2]=p>>>0>0|(p|0)==0&o>>>0>2147483647?14854:15878;y=s;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}l=Ar(0,0,o|0,p|0)|0;j=I;n=e+28|0;v=c[n>>2]|0;t=e+32|0;if(!((v+16|0)>>>0<(c[t>>2]|0)>>>0)){b=e+36|0;p=c[b>>2]|0;r=p<<1;q=e+24|0;o=c[q>>2]|0;v=v-o|0;w=v+16|0;A=r>>>0<w>>>0?w:r;z=qd(c[e+16>>2]|0,o,p,A)|0;c[q>>2]=z;c[b>>2]=A;v=z+v|0;c[n>>2]=v;c[t>>2]=z+A}c[n>>2]=v+16;if((v|0)==0){y=s;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}e=v+12|0;c[e>>2]=4614;A=v;c[A>>2]=l;c[A+4>>2]=j;if((j|0)>-1|(j|0)==-1&l>>>0>4294967295){n=j>>>0>0|(j|0)==0&l>>>0>4294967295?12806:14854;c[e>>2]=n;if(j>>>0>0|(j|0)==0&l>>>0>2147483647){y=s;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}c[e>>2]=n|1024;y=s;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}else{if(!((j|0)>-1|(j|0)==-1&l>>>0>2147483647)){y=s;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}c[e>>2]=5638;y=s;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}}else{j=s;m=u;n=0}}}while(0);n=n+w|0;if((n|0)>=309){Ha(6056,6072,47,6136)}if((n|0)<-308){u=0.0}else{u=+h[1120+(n+308<<3)>>3]}m=m*u;if(l){m=-m}l=e+28|0;s=c[l>>2]|0;o=e+32|0;if(!((s+16|0)>>>0<(c[o>>2]|0)>>>0)){n=e+36|0;p=c[n>>2]|0;b=p<<1;q=e+24|0;r=c[q>>2]|0;t=s-r|0;s=t+16|0;A=b>>>0<s>>>0?s:b;z=qd(c[e+16>>2]|0,r,p,A)|0;c[q>>2]=z;c[n>>2]=A;s=z+t|0;c[l>>2]=s;c[o>>2]=z+A}c[l>>2]=s+16;if((s|0)==0){y=j;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}c[s+12>>2]=16902;h[k>>3]=m;c[s>>2]=c[k>>2];c[s+4>>2]=c[k+4>>2];y=j;A=d;z=A;c[z>>2]=y;A=A+4|0;c[A>>2]=f;i=g;return}function qd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;if((b|0)==0){b=e+3&-4;g=c[a>>2]|0;d=c[g+4>>2]|0;if((d+b|0)>>>0>(c[g>>2]|0)>>>0){d=c[a+4>>2]|0;m=d>>>0>b>>>0?d:b;d=cr(m+12|0)|0;c[d>>2]=m;c[d+4>>2]=0;c[d+8>>2]=g;c[a>>2]=d;g=d;d=0}a=g+12+d|0;if((a&3|0)!=0){Ha(1080,1e3,242,1112)}c[g+4>>2]=d+b;m=a;i=f;return m|0}if(!(d>>>0<e>>>0)){m=b;i=f;return m|0}h=c[a>>2]|0;l=h+4|0;g=c[l>>2]|0;if((h+12+(g-d)|0)==(b|0)){m=g+(3-d+e&-4)|0;k=c[h>>2]|0;if(!(m>>>0>k>>>0)){c[l>>2]=m;if((b&3|0)==0){m=b;i=f;return m|0}else{Ha(960,1e3,263,1056)}}else{j=k}}else{j=c[h>>2]|0}e=e+3&-4;if((g+e|0)>>>0>j>>>0){g=c[a+4>>2]|0;m=g>>>0>e>>>0?g:e;g=cr(m+12|0)|0;c[g>>2]=m;c[g+4>>2]=0;c[g+8>>2]=h;c[a>>2]=g;h=g;g=0}a=h+12+g|0;if((a&3|0)!=0){Ha(1080,1e3,242,1112)}c[h+4>>2]=g+e;if((a|0)==0){Ha(1064,1e3,270,1056)}Fr(a|0,b|0,d|0)|0;m=a;i=f;return m|0}function rd(b,c){b=b|0;c=c|0;var d=0;d=i;if(c>>>0<128){a[b]=c;b=b+1|0;i=d;return b|0}if(c>>>0<2048){a[b]=c>>>6|192;a[b+1|0]=c&63|128;b=b+2|0;i=d;return b|0}if(c>>>0<65536){a[b]=c>>>12|224;a[b+1|0]=c>>>6&63|128;a[b+2|0]=c&63|128;b=b+3|0;i=d;return b|0}if(!(c>>>0<1114112)){Ha(6688,1e3,351,6712)}a[b]=c>>>18|240;a[b+1|0]=c>>>12&63|128;a[b+2|0]=c>>>6&63|128;a[b+3|0]=c&63|128;b=b+4|0;i=d;return b|0}function sd(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;h=b+28|0;j=c[h>>2]|0;k=b+32|0;if(!((j+16|0)>>>0<(c[k>>2]|0)>>>0)){n=b+36|0;l=c[n>>2]|0;p=l<<1;o=b+24|0;m=c[o>>2]|0;j=j-m|0;q=j+16|0;q=p>>>0<q>>>0?q:p;p=qd(c[b+16>>2]|0,m,l,q)|0;c[o>>2]=p;c[n>>2]=q;j=p+j|0;c[h>>2]=j;c[k>>2]=p+q}c[h>>2]=j+16;h=(j|0)==0;if(!f){if(h){i=g;return}if((d|0)==0){Ha(6648,224,120,6656)}c[j+12>>2]=1048581;c[j>>2]=d;c[j+4>>2]=e;i=g;return}if(h){i=g;return}b=c[b+16>>2]|0;if((d|0)==0){Ha(6648,224,659,6672)}c[j+12>>2]=3145733;f=e+4&-4;h=c[b>>2]|0;k=c[h+4>>2]|0;if((k+f|0)>>>0>(c[h>>2]|0)>>>0){k=c[b+4>>2]|0;q=k>>>0>f>>>0?k:f;k=cr(q+12|0)|0;c[k>>2]=q;c[k+4>>2]=0;c[k+8>>2]=h;c[b>>2]=k;h=k;k=0}b=h+12+k|0;if((b&3|0)!=0){Ha(1080,1e3,242,1112)}c[h+4>>2]=k+f;c[j>>2]=b;c[j+4>>2]=e;Fr(b|0,d|0,e|0)|0;a[(c[j>>2]|0)+e|0]=0;i=g;return}function td(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;j=a+28|0;d=c[j>>2]|0;h=c[a+24>>2]|0;f=b<<5;if((d-h|0)>>>0<f>>>0){Ha(440,472,52,536)}g=d+(0-f)|0;c[j>>2]=g;if(!((g-h|0)>>>0>15)){Ha(6896,472,59,6920)}h=-16-f|0;j=c[a+16>>2]|0;c[d+(h|12)>>2]=3;a=c[j>>2]|0;k=c[a+4>>2]|0;if((k+f|0)>>>0>(c[a>>2]|0)>>>0){k=c[j+4>>2]|0;l=k>>>0>f>>>0?k:f;k=cr(l+12|0)|0;c[k>>2]=l;c[k+4>>2]=0;c[k+8>>2]=a;c[j>>2]=k;a=k;k=0}j=a+12+k|0;if((j&3|0)==0){c[a+4>>2]=k+f;c[d+h>>2]=j;Fr(j|0,g|0,f|0)|0;c[d+(h|8)>>2]=b;c[d+(h|4)>>2]=b;i=e;return}else{Ha(1080,1e3,242,1112)}}function ud(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;h=i;c[a>>2]=b;k=a+4|0;j=a+8|0;e=a+12|0;g=a+16|0;f=a+20|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;c[f>>2]=d;if((d|0)==0){Ha(7120,472,17,7144)}if((b|0)==0){b=hr(20)|0;c[b>>2]=0;c[b+4>>2]=65536;c[b+8>>2]=0;n=b+12|0;c[n>>2]=0;l=b+16|0;c[l>>2]=0;m=hr(1)|0;c[n>>2]=m;c[l>>2]=m;l=cr(65548)|0;c[l>>2]=65536;c[l+4>>2]=0;c[l+8>>2]=0;c[b>>2]=l;c[a>>2]=b;c[k>>2]=b}d=d+3&-4;k=c[b>>2]|0;a=c[k+4>>2]|0;if((a+d|0)>>>0>(c[k>>2]|0)>>>0){a=c[b+4>>2]|0;n=a>>>0>d>>>0?a:d;a=cr(n+12|0)|0;c[a>>2]=n;c[a+4>>2]=0;c[a+8>>2]=k;c[b>>2]=a;b=a;a=0}else{b=k}k=b+12|0;l=k+a|0;if((l&3|0)==0){c[b+4>>2]=a+d;c[j>>2]=l;c[e>>2]=l;c[g>>2]=k+(a+(c[f>>2]|0));i=h;return}else{Ha(1080,1e3,242,1112)}}function vd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;i=i+32|0;f=e;j=b+8|0;l=c[b>>2]|0;g=((c[b+4>>2]|0)-l|0)/12|0;k=g+1|0;if(k>>>0>357913941){io(0)}l=((c[b+8>>2]|0)-l|0)/12|0;if(l>>>0<178956970){l=l<<1;k=l>>>0<k>>>0?k:l;n=f+12|0;c[n>>2]=0;c[f+16>>2]=j;if((k|0)==0){l=0;j=0}else{j=k;h=6}}else{n=f+12|0;c[n>>2]=0;c[f+16>>2]=j;j=357913941;h=6}if((h|0)==6){l=j;j=hr(j*12|0)|0}c[f>>2]=j;m=j+(g*12|0)|0;h=f+8|0;c[h>>2]=m;k=f+4|0;c[k>>2]=m;c[n>>2]=j+(l*12|0);do{if((m|0)==0){m=0}else{if((a[d]&1)==0){c[m+0>>2]=c[d+0>>2];c[m+4>>2]=c[d+4>>2];c[m+8>>2]=c[d+8>>2];break}l=c[d+8>>2]|0;d=c[d+4>>2]|0;if(d>>>0>4294967279){Ii(0)}if(d>>>0<11){a[m]=d<<1;g=m+1|0}else{o=d+16&-16;n=hr(o)|0;c[j+(g*12|0)+8>>2]=n;c[m>>2]=o|1;c[j+(g*12|0)+4>>2]=d;g=n}Fr(g|0,l|0,d|0)|0;a[g+d|0]=0;m=c[h>>2]|0}}while(0);c[h>>2]=m+12;wd(b,f);b=c[k>>2]|0;d=c[h>>2]|0;if((d|0)!=(b|0)){while(1){g=d+ -12|0;c[h>>2]=g;if(!((a[g]&1)==0)){jr(c[d+ -4>>2]|0)}if((g|0)==(b|0)){break}else{d=g}}}f=c[f>>2]|0;if((f|0)==0){i=e;return}jr(f);i=e;return}function wd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;h=i;k=c[b>>2]|0;g=b+4|0;m=c[g>>2]|0;f=d+4|0;p=c[f>>2]|0;do{if((m|0)!=(k|0)){while(1){o=p+ -12|0;l=m+ -12|0;if((a[l]&1)==0){c[o+0>>2]=c[l+0>>2];c[o+4>>2]=c[l+4>>2];c[o+8>>2]=c[l+8>>2]}else{n=c[m+ -4>>2]|0;m=c[m+ -8>>2]|0;if(m>>>0>4294967279){k=5;break}if(m>>>0<11){a[o]=m<<1;o=o+1|0}else{r=m+16&-16;q=hr(r)|0;c[p+ -4>>2]=q;c[o>>2]=r|1;c[p+ -8>>2]=m;o=q}Fr(o|0,n|0,m|0)|0;a[o+m|0]=0}p=(c[f>>2]|0)+ -12|0;c[f>>2]=p;if((l|0)==(k|0)){k=11;break}else{m=l}}if((k|0)==5){Ii(0)}else if((k|0)==11){e=p;j=c[b>>2]|0;break}}else{e=p;j=k}}while(0);c[b>>2]=e;c[f>>2]=j;p=d+8|0;r=c[g>>2]|0;c[g>>2]=c[p>>2];c[p>>2]=r;p=b+8|0;r=d+12|0;q=c[p>>2]|0;c[p>>2]=c[r>>2];c[r>>2]=q;c[d>>2]=c[f>>2];i=h;return}function xd(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;f=a+124|0;d=c[f>>2]|0;if((d|0)!=0){g=a+128|0;while(1){e=c[g>>2]|0;if((e|0)==(d|0)){break}k=e+ -12|0;c[g>>2]=k;Ud(k)}jr(c[f>>2]|0)}e=a+112|0;d=c[e>>2]|0;if((d|0)!=0){g=a+116|0;while(1){f=c[g>>2]|0;if((f|0)==(d|0)){break}k=f+ -12|0;c[g>>2]=k;Ud(k)}jr(c[e>>2]|0)}e=a+100|0;d=c[e>>2]|0;if((d|0)!=0){f=a+104|0;j=c[f>>2]|0;if((j|0)!=(d|0)){while(1){h=j+ -12|0;c[f>>2]=h;g=c[h>>2]|0;if((g|0)!=0){j=j+ -8|0;while(1){k=c[j>>2]|0;if((k|0)==(g|0)){break}k=k+ -12|0;c[j>>2]=k;Ud(k)}jr(c[h>>2]|0);h=c[f>>2]|0}if((h|0)==(d|0)){break}else{j=h}}d=c[e>>2]|0}jr(d)}d=c[a+88>>2]|0;if((d|0)!=0){f=a+92|0;e=c[f>>2]|0;if((e|0)!=(d|0)){c[f>>2]=e+(~((e+ -4+(0-d)|0)>>>2)<<2)}jr(d)}d=c[a+76>>2]|0;if((d|0)!=0){jr(d)}e=a+64|0;f=c[e>>2]|0;if((f|0)!=0){d=a+68|0;j=c[d>>2]|0;if((j|0)!=(f|0)){while(1){h=j+ -12|0;c[d>>2]=h;g=c[h>>2]|0;if((g|0)!=0){j=j+ -8|0;h=c[j>>2]|0;if((h|0)!=(g|0)){c[j>>2]=h+(~((h+ -4+(0-g)|0)>>>2)<<2)}jr(g);h=c[d>>2]|0}if((h|0)==(f|0)){break}else{j=h}}f=c[e>>2]|0}jr(f)}d=c[a+52>>2]|0;if((d|0)!=0){e=a+56|0;f=c[e>>2]|0;if((f|0)!=(d|0)){c[e>>2]=f+(~((f+ -4+(0-d)|0)>>>2)<<2)}jr(d)}zd(a+40|0,c[a+44>>2]|0);yd(a+28|0,c[a+32>>2]|0);d=c[a+16>>2]|0;if((d|0)==0){i=b;return}e=a+20|0;a=c[e>>2]|0;if((a|0)!=(d|0)){c[e>>2]=a+(~((a+ -4+(0-d)|0)>>>2)<<2)}jr(d);i=b;return}function yd(a,b){a=a|0;b=b|0;var d=0;d=i;if((b|0)==0){i=d;return}else{yd(a,c[b>>2]|0);yd(a,c[b+4>>2]|0);jr(b);i=d;return}}function zd(a,b){a=a|0;b=b|0;var d=0;d=i;if((b|0)==0){i=d;return}else{zd(a,c[b>>2]|0);zd(a,c[b+4>>2]|0);jr(b);i=d;return}}function Ad(a){a=a|0;var b=0,d=0;b=i;if(a>>>0>31){d=-1;i=b;return d|0}a=7160+(a<<2)|0;d=c[a>>2]|0;if((d|0)!=0){pc[c[(c[d>>2]|0)+4>>2]&255](d)}c[a>>2]=0;d=0;i=b;return d|0}function Bd(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0;h=i;i=i+16|0;j=h;if(b>>>0>31){l=-1;i=h;return l|0}k=c[7160+(b<<2)>>2]|0;if((k|0)==0){l=-1;i=h;return l|0}c[j>>2]=0;b=j+4|0;c[b>>2]=0;c[j+8>>2]=0;do{if(yc[c[(c[k>>2]|0)+20>>2]&7](k,d,e,j)|0){e=c[j>>2]|0;d=a[e]|0;k=(d&1)==0;if(k){l=(d&255)>>>1}else{l=c[e+4>>2]|0}if(l>>>0>(c[g>>2]|0)>>>0){if(k){f=(d&255)>>>1}else{f=c[e+4>>2]|0}c[g>>2]=f;g=-1;break}if(k){k=e+1|0;d=(d&255)>>>1}else{k=c[e+8>>2]|0;d=c[e+4>>2]|0}Fr(f|0,k|0,d|0)|0;f=a[e]|0;if((f&1)==0){f=(f&255)>>>1}else{f=c[e+4>>2]|0}c[g>>2]=f;g=0}else{c[g>>2]=0;g=-1;e=c[j>>2]|0}}while(0);if((e|0)==0){l=g;i=h;return l|0}f=c[b>>2]|0;if((f|0)!=(e|0)){do{d=f+ -12|0;c[b>>2]=d;if((a[d]&1)==0){f=d}else{jr(c[f+ -4>>2]|0);f=c[b>>2]|0}}while((f|0)!=(e|0));e=c[j>>2]|0}jr(e);l=g;i=h;return l|0}function Cd(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0;j=i;i=i+16|0;h=j;if(b>>>0>31){b=-1;i=j;return b|0}b=c[7160+(b<<2)>>2]|0;if((b|0)==0){b=-1;i=j;return b|0}c[h+0>>2]=0;c[h+4>>2]=0;c[h+8>>2]=0;do{if(yc[c[(c[b>>2]|0)+28>>2]&7](b,d,e,h)|0){d=a[h]|0;b=(d&1)==0;if(b){e=(d&255)>>>1}else{e=c[h+4>>2]|0}if(e>>>0>(c[g>>2]|0)>>>0){if(b){g=(d&255)>>>1;break}else{g=c[h+4>>2]|0;break}}if(b){Fr(f|0,h+1|0,(d&255)>>>1|0)|0;f=(d&255)>>>1}else{Fr(f|0,c[h+8>>2]|0,c[h+4>>2]|0)|0;f=c[h+4>>2]|0}c[g>>2]=f;g=0}else{c[g>>2]=0;g=-1;d=a[h]|0}}while(0);if((d&1)==0){b=g;i=j;return b|0}jr(c[h+8>>2]|0);b=g;i=j;return b|0}function Dd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;if(!(a>>>0>31)?(f=c[7160+(a<<2)>>2]|0,(f|0)!=0):0){b=((mc[c[(c[f>>2]|0)+8>>2]&31](f,b,d)|0)^1)<<31>>31}else{b=-1}i=e;return b|0}function Ed(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;if(!(a>>>0>31)?(f=c[7160+(a<<2)>>2]|0,(f|0)!=0):0){b=((mc[c[(c[f>>2]|0)+12>>2]&31](f,b,d)|0)^1)<<31>>31}else{b=-1}i=e;return b|0}function Fd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;if(!(a>>>0>31)?(f=c[7160+(a<<2)>>2]|0,(f|0)!=0):0){b=((mc[c[(c[f>>2]|0)+16>>2]&31](f,b,d)|0)^1)<<31>>31}else{b=-1}i=e;return b|0}function Gd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+16|0;g=e;f=e+8|0;h=e+4|0;c[f>>2]=b;c[h>>2]=d;if((c[f>>2]|0)==0){i=e;return}if((a[c[f>>2]|0]|0)==0){i=e;return}b=c[q>>2]|0;c[g>>2]=c[f>>2];rb(b|0,7288,g|0)|0;if(!((c[h>>2]|0)!=-1)){i=e;return}b=c[q>>2]|0;c[g>>2]=c[h>>2];rb(b|0,7296,g|0)|0;i=e;return}function Hd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;f=i;i=i+16|0;e=f;h=f+12|0;g=f+8|0;f=f+4|0;c[h>>2]=a;c[g>>2]=b;c[f>>2]=d;Gd(c[h>>2]|0,c[g>>2]|0);a=c[q>>2]|0;c[e>>2]=c[f>>2];rb(a|0,7304,e|0)|0;Mb()}function Id(a){a=a|0;var b=0;b=i;i=i+16|0;c[b>>2]=a;c[1834]=c[1834]|c[b>>2];c[1872]=10/(c[1870]|0)|0;Mb()}function Jd(){Id(2)}function Kd(a){a=a|0;var b=0,d=0,e=0,f=0;f=i;i=i+16|0;b=f;d=f+8|0;e=f+4|0;c[d>>2]=a;c[e>>2]=cr(c[d>>2]|0)|0;if((c[e>>2]|0)==0){f=c[q>>2]|0;c[b>>2]=c[d>>2];rb(f|0,7368,b|0)|0;Mb()}else{i=f;return c[e>>2]|0}return 0}function Ld(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;j=i;i=i+32|0;e=j;k=j+20|0;f=j+16|0;g=j+12|0;h=j+8|0;c[k>>2]=a;c[f>>2]=b;c[g>>2]=d;c[h>>2]=er(c[k>>2]|0,c[g>>2]|0)|0;if((c[h>>2]|0)==0){k=c[q>>2]|0;a=c[g>>2]|0;c[e>>2]=c[f>>2];c[e+4>>2]=a;rb(k|0,7416,e|0)|0;Mb()}else{i=j;return c[h>>2]|0}return 0}function Md(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;i=i+16|0;e=d+4|0;c[e>>2]=a;c[d>>2]=b;dr(c[e>>2]|0);i=d;return}function Nd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;e=i;i=i+16|0;f=e+12|0;h=e+8|0;d=e+4|0;g=e;c[f>>2]=a;c[h>>2]=b;c[g>>2]=(c[h>>2]|0)+8;c[d>>2]=sc[c[1836]&127](c[g>>2]|0)|0;c[(c[d>>2]|0)+4>>2]=c[g>>2];c[c[d>>2]>>2]=c[c[f>>2]>>2];c[c[f>>2]>>2]=c[d>>2];i=e;return(c[d>>2]|0)+8|0}function Od(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;d=b+4|0;e=b;c[d>>2]=a;while(1){if((c[d>>2]|0)==0){break}c[e>>2]=c[c[d>>2]>>2];qc[c[1840]&63](c[d>>2]|0,c[(c[d>>2]|0)+4>>2]|0);c[d>>2]=c[e>>2]}i=b;return}function Pd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;e=i;i=i+64|0;k=e+56|0;p=e+52|0;q=e+48|0;g=e+44|0;j=e+40|0;f=e+36|0;l=e+32|0;r=e+28|0;m=e+24|0;h=e+20|0;o=e+16|0;s=e+12|0;t=e+8|0;u=e+4|0;n=e;c[k>>2]=a;c[p>>2]=b;c[q>>2]=d;c[l>>2]=c[(c[p>>2]|0)+4>>2];c[r>>2]=c[(c[q>>2]|0)+4>>2];d=c[l>>2]|0;c[h>>2]=(c[l>>2]|0)>=0?d:0-d|0;d=c[r>>2]|0;c[o>>2]=(c[r>>2]|0)>=0?d:0-d|0;if((c[h>>2]|0)<(c[o>>2]|0)){c[s>>2]=c[p>>2];c[p>>2]=c[q>>2];c[q>>2]=c[s>>2];c[t>>2]=c[l>>2];c[l>>2]=c[r>>2];c[r>>2]=c[t>>2];c[u>>2]=c[h>>2];c[h>>2]=c[o>>2];c[o>>2]=c[u>>2]}c[m>>2]=(c[h>>2]|0)+1;s=c[k>>2]|0;if((((c[m>>2]|0)>(c[c[k>>2]>>2]|0)|0)!=0|0)!=0){s=ee(s,c[m>>2]|0)|0}else{s=c[s+8>>2]|0}c[f>>2]=s;c[g>>2]=c[(c[p>>2]|0)+8>>2];c[j>>2]=c[(c[q>>2]|0)+8>>2];if((c[l>>2]^c[r>>2]|0)>=0){c[n>>2]=oe(c[f>>2]|0,c[g>>2]|0,c[h>>2]|0,c[j>>2]|0,c[o>>2]|0)|0;c[(c[f>>2]|0)+(c[h>>2]<<2)>>2]=c[n>>2];c[m>>2]=(c[h>>2]|0)+(c[n>>2]|0);if((c[l>>2]|0)>=0){b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}c[m>>2]=0-(c[m>>2]|0);b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}if((c[h>>2]|0)!=(c[o>>2]|0)){re(c[f>>2]|0,c[g>>2]|0,c[h>>2]|0,c[j>>2]|0,c[o>>2]|0)|0;c[m>>2]=c[h>>2];while(1){if((c[m>>2]|0)<=0){break}if((c[(c[f>>2]|0)+((c[m>>2]|0)-1<<2)>>2]|0)!=0){break}c[m>>2]=(c[m>>2]|0)+ -1}if((c[l>>2]|0)>=0){b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}c[m>>2]=0-(c[m>>2]|0);b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}a=(ff(c[g>>2]|0,c[j>>2]|0,c[h>>2]|0)|0)<0;n=c[f>>2]|0;if(a){te(n,c[j>>2]|0,c[g>>2]|0,c[h>>2]|0)|0;c[m>>2]=c[h>>2];while(1){if((c[m>>2]|0)<=0){break}if((c[(c[f>>2]|0)+((c[m>>2]|0)-1<<2)>>2]|0)!=0){break}c[m>>2]=(c[m>>2]|0)+ -1}if((c[l>>2]|0)<0){b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}c[m>>2]=0-(c[m>>2]|0);b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}else{te(n,c[g>>2]|0,c[j>>2]|0,c[h>>2]|0)|0;c[m>>2]=c[h>>2];while(1){if((c[m>>2]|0)<=0){break}if((c[(c[f>>2]|0)+((c[m>>2]|0)-1<<2)>>2]|0)!=0){break}c[m>>2]=(c[m>>2]|0)+ -1}if((c[l>>2]|0)>=0){b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}c[m>>2]=0-(c[m>>2]|0);b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}}function Qd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;m=i;i=i+48|0;f=m+32|0;n=m+28|0;g=m+24|0;k=m+20|0;j=m+16|0;o=m+12|0;h=m+8|0;l=m+4|0;e=m;c[f>>2]=a;c[n>>2]=b;c[g>>2]=d;c[o>>2]=c[(c[n>>2]|0)+4>>2];if((c[o>>2]|0)==0){c[c[(c[f>>2]|0)+8>>2]>>2]=c[g>>2];c[(c[f>>2]|0)+4>>2]=(c[g>>2]|0)!=0;i=m;return}d=c[o>>2]|0;c[l>>2]=(c[o>>2]|0)>=0?d:0-d|0;d=c[f>>2]|0;if(((((c[l>>2]|0)+1|0)>(c[c[f>>2]>>2]|0)|0)!=0|0)!=0){d=ee(d,(c[l>>2]|0)+1|0)|0}else{d=c[d+8>>2]|0}c[j>>2]=d;c[k>>2]=c[(c[n>>2]|0)+8>>2];do{if((c[o>>2]|0)>=0){c[e>>2]=pe(c[j>>2]|0,c[k>>2]|0,c[l>>2]|0,c[g>>2]|0)|0;c[(c[j>>2]|0)+(c[l>>2]<<2)>>2]=c[e>>2];c[h>>2]=(c[l>>2]|0)+(c[e>>2]|0)}else{if((c[l>>2]|0)==1?(c[c[k>>2]>>2]|0)>>>0<(c[g>>2]|0)>>>0:0){c[c[j>>2]>>2]=(c[g>>2]|0)-(c[c[k>>2]>>2]|0);c[h>>2]=1;break}se(c[j>>2]|0,c[k>>2]|0,c[l>>2]|0,c[g>>2]|0)|0;c[h>>2]=0-((c[l>>2]|0)-((c[(c[j>>2]|0)+((c[l>>2]|0)-1<<2)>>2]|0)==0))}}while(0);c[(c[f>>2]|0)+4>>2]=c[h>>2];i=m;return}function Rd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0;j=i;i=i+208|0;h=j+200|0;ca=j+196|0;ba=j+192|0;k=j+188|0;e=j+184|0;n=j+180|0;m=j+176|0;f=j+172|0;g=j+168|0;P=j+164|0;l=j+160|0;U=j+156|0;R=j+152|0;T=j+148|0;Y=j+144|0;Q=j+140|0;S=j+136|0;W=j+132|0;V=j+128|0;K=j+124|0;$=j+120|0;aa=j+116|0;F=j+112|0;N=j+108|0;O=j+104|0;M=j+100|0;G=j+96|0;J=j+92|0;L=j+88|0;H=j+84|0;I=j+80|0;E=j+76|0;Z=j+72|0;_=j+68|0;X=j+64|0;x=j+60|0;v=j+56|0;w=j+52|0;u=j+48|0;o=j+44|0;r=j+40|0;t=j+36|0;p=j+32|0;q=j+28|0;s=j+24|0;y=j+20|0;B=j+16|0;D=j+12|0;z=j+8|0;A=j+4|0;C=j;c[h>>2]=a;c[ca>>2]=b;c[ba>>2]=d;c[l>>2]=0;c[n>>2]=c[(c[ca>>2]|0)+4>>2];c[m>>2]=c[(c[ba>>2]|0)+4>>2];c[k>>2]=c[(c[ca>>2]|0)+8>>2];c[e>>2]=c[(c[ba>>2]|0)+8>>2];d=c[m>>2]|0;do{if((c[n>>2]|0)>=0){if((d|0)>=0){c[g>>2]=(c[n>>2]|0)<(c[m>>2]|0)?c[n>>2]|0:c[m>>2]|0;c[P>>2]=(c[g>>2]|0)-1;while(1){if((c[P>>2]|0)<0){break}if((c[(c[k>>2]|0)+(c[P>>2]<<2)>>2]&c[(c[e>>2]|0)+(c[P>>2]<<2)>>2]|0)!=0){break}c[P>>2]=(c[P>>2]|0)+ -1}c[g>>2]=(c[P>>2]|0)+1;l=c[h>>2]|0;if((((c[g>>2]|0)>(c[c[h>>2]>>2]|0)|0)!=0|0)!=0){l=ee(l,c[g>>2]|0)|0}else{l=c[l+8>>2]|0}c[f>>2]=l;c[(c[h>>2]|0)+4>>2]=c[g>>2];if((((c[g>>2]|0)!=0|0)!=0|0)==0){i=j;return}c[U>>2]=c[k>>2];c[R>>2]=c[e>>2];c[T>>2]=c[f>>2];c[Y>>2]=c[g>>2];c[U>>2]=(c[U>>2]|0)+(c[Y>>2]<<2);c[R>>2]=(c[R>>2]|0)+(c[Y>>2]<<2);c[T>>2]=(c[T>>2]|0)+(c[Y>>2]<<2);c[Y>>2]=0-(c[Y>>2]|0);do{c[Q>>2]=c[(c[U>>2]|0)+(c[Y>>2]<<2)>>2];c[S>>2]=c[(c[R>>2]|0)+(c[Y>>2]<<2)>>2];c[(c[T>>2]|0)+(c[Y>>2]<<2)>>2]=c[Q>>2]&c[S>>2];ca=(c[Y>>2]|0)+1|0;c[Y>>2]=ca}while((ca|0)!=0);i=j;return}}else{if((d|0)>=0){c[Z>>2]=c[k>>2];c[k>>2]=c[e>>2];c[e>>2]=c[Z>>2];c[_>>2]=c[n>>2];c[n>>2]=c[m>>2];c[m>>2]=c[_>>2];break}c[n>>2]=0-(c[n>>2]|0);c[m>>2]=0-(c[m>>2]|0);if((c[n>>2]|0)>(c[m>>2]|0)){c[$>>2]=c[k>>2];c[k>>2]=c[e>>2];c[e>>2]=c[$>>2];c[aa>>2]=c[n>>2];c[n>>2]=c[m>>2];c[m>>2]=c[aa>>2]}o=(c[n>>2]|0)+(c[m>>2]|0)<<2;if((((c[n>>2]|0)+(c[m>>2]|0)<<2>>>0<65536|0)!=0|0)!=0){ca=i;i=i+((1*o|0)+15&-16)|0;o=ca}else{o=Nd(l,o)|0}c[W>>2]=o;c[V>>2]=(c[W>>2]|0)+(c[n>>2]<<2);se(c[W>>2]|0,c[k>>2]|0,c[n>>2]|0,1)|0;c[k>>2]=c[W>>2];se(c[V>>2]|0,c[e>>2]|0,c[m>>2]|0,1)|0;c[e>>2]=c[V>>2];o=c[h>>2]|0;if((((1+(c[m>>2]|0)|0)>(c[c[h>>2]>>2]|0)|0)!=0|0)!=0){o=ee(o,1+(c[m>>2]|0)|0)|0}else{o=c[o+8>>2]|0}c[f>>2]=o;if(((c[m>>2]|0)-(c[n>>2]|0)|0)!=0){c[F>>2]=(c[m>>2]|0)-(c[n>>2]|0)-1;c[N>>2]=(c[f>>2]|0)+(c[n>>2]<<2);c[O>>2]=(c[e>>2]|0)+(c[n>>2]<<2);ca=c[O>>2]|0;c[O>>2]=ca+4;c[M>>2]=c[ca>>2];if((c[F>>2]|0)!=0){do{ba=c[M>>2]|0;ca=c[N>>2]|0;c[N>>2]=ca+4;c[ca>>2]=ba;ca=c[O>>2]|0;c[O>>2]=ca+4;c[M>>2]=c[ca>>2];ca=(c[F>>2]|0)+ -1|0;c[F>>2]=ca}while((ca|0)!=0)}ba=c[M>>2]|0;ca=c[N>>2]|0;c[N>>2]=ca+4;c[ca>>2]=ba}c[G>>2]=c[k>>2];c[J>>2]=c[e>>2];c[L>>2]=c[f>>2];c[H>>2]=c[n>>2];c[G>>2]=(c[G>>2]|0)+(c[H>>2]<<2);c[J>>2]=(c[J>>2]|0)+(c[H>>2]<<2);c[L>>2]=(c[L>>2]|0)+(c[H>>2]<<2);c[H>>2]=0-(c[H>>2]|0);do{c[I>>2]=c[(c[G>>2]|0)+(c[H>>2]<<2)>>2];c[E>>2]=c[(c[J>>2]|0)+(c[H>>2]<<2)>>2];c[(c[L>>2]|0)+(c[H>>2]<<2)>>2]=c[I>>2]|c[E>>2];ca=(c[H>>2]|0)+1|0;c[H>>2]=ca}while((ca|0)!=0);c[g>>2]=c[m>>2];c[K>>2]=pe(c[f>>2]|0,c[f>>2]|0,c[g>>2]|0,1)|0;c[(c[f>>2]|0)+(c[g>>2]<<2)>>2]=c[K>>2];c[g>>2]=(c[g>>2]|0)+((c[K>>2]|0)!=0);c[(c[h>>2]|0)+4>>2]=0-(c[g>>2]|0);if((((c[l>>2]|0)!=0|0)!=0|0)==0){i=j;return}Od(c[l>>2]|0);i=j;return}}while(0);c[m>>2]=0-(c[m>>2]|0);E=c[m>>2]<<2;if(((c[m>>2]<<2>>>0<65536|0)!=0|0)!=0){ca=i;i=i+((1*E|0)+15&-16)|0;E=ca}else{E=Nd(l,E)|0}c[X>>2]=E;se(c[X>>2]|0,c[e>>2]|0,c[m>>2]|0,1)|0;c[e>>2]=c[X>>2];E=c[n>>2]|0;if((c[n>>2]|0)>(c[m>>2]|0)){c[g>>2]=E;n=c[h>>2]|0;if((((c[g>>2]|0)>(c[c[h>>2]>>2]|0)|0)!=0|0)!=0){n=ee(n,c[g>>2]|0)|0}else{n=c[n+8>>2]|0}c[f>>2]=n;if(((c[g>>2]|0)-(c[m>>2]|0)|0)!=0){c[x>>2]=(c[g>>2]|0)-(c[m>>2]|0)-1;c[v>>2]=(c[f>>2]|0)+(c[m>>2]<<2);c[w>>2]=(c[k>>2]|0)+(c[m>>2]<<2);ca=c[w>>2]|0;c[w>>2]=ca+4;c[u>>2]=c[ca>>2];if((c[x>>2]|0)!=0){do{ba=c[u>>2]|0;ca=c[v>>2]|0;c[v>>2]=ca+4;c[ca>>2]=ba;ca=c[w>>2]|0;c[w>>2]=ca+4;c[u>>2]=c[ca>>2];ca=(c[x>>2]|0)+ -1|0;c[x>>2]=ca}while((ca|0)!=0)}ba=c[u>>2]|0;ca=c[v>>2]|0;c[v>>2]=ca+4;c[ca>>2]=ba}c[o>>2]=c[k>>2];c[r>>2]=c[e>>2];c[t>>2]=c[f>>2];c[p>>2]=c[m>>2];c[o>>2]=(c[o>>2]|0)+(c[p>>2]<<2);c[r>>2]=(c[r>>2]|0)+(c[p>>2]<<2);c[t>>2]=(c[t>>2]|0)+(c[p>>2]<<2);c[p>>2]=0-(c[p>>2]|0);do{c[q>>2]=c[(c[o>>2]|0)+(c[p>>2]<<2)>>2];c[s>>2]=c[(c[r>>2]|0)+(c[p>>2]<<2)>>2];c[(c[t>>2]|0)+(c[p>>2]<<2)>>2]=c[q>>2]&~c[s>>2];ca=(c[p>>2]|0)+1|0;c[p>>2]=ca}while((ca|0)!=0);c[(c[h>>2]|0)+4>>2]=c[g>>2]}else{c[P>>2]=E-1;while(1){if((c[P>>2]|0)<0){break}if((c[(c[k>>2]|0)+(c[P>>2]<<2)>>2]&~c[(c[e>>2]|0)+(c[P>>2]<<2)>>2]|0)!=0){break}c[P>>2]=(c[P>>2]|0)+ -1}c[g>>2]=(c[P>>2]|0)+1;m=c[h>>2]|0;if((((c[g>>2]|0)>(c[c[h>>2]>>2]|0)|0)!=0|0)!=0){m=ee(m,c[g>>2]|0)|0}else{m=c[m+8>>2]|0}c[f>>2]=m;if((((c[g>>2]|0)!=0|0)!=0|0)!=0){c[y>>2]=c[k>>2];c[B>>2]=c[e>>2];c[D>>2]=c[f>>2];c[z>>2]=c[g>>2];c[y>>2]=(c[y>>2]|0)+(c[z>>2]<<2);c[B>>2]=(c[B>>2]|0)+(c[z>>2]<<2);c[D>>2]=(c[D>>2]|0)+(c[z>>2]<<2);c[z>>2]=0-(c[z>>2]|0);do{c[A>>2]=c[(c[y>>2]|0)+(c[z>>2]<<2)>>2];c[C>>2]=c[(c[B>>2]|0)+(c[z>>2]<<2)>>2];c[(c[D>>2]|0)+(c[z>>2]<<2)>>2]=c[A>>2]&~c[C>>2];ca=(c[z>>2]|0)+1|0;c[z>>2]=ca}while((ca|0)!=0)}c[(c[h>>2]|0)+4>>2]=c[g>>2]}if((((c[l>>2]|0)!=0|0)!=0|0)==0){i=j;return}Od(c[l>>2]|0);i=j;return}function Sd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;i=i+80|0;g=f+68|0;x=f+64|0;u=f+60|0;p=f+56|0;k=f+52|0;h=f+48|0;y=f+44|0;q=f+40|0;v=f+36|0;r=f+32|0;j=f+28|0;s=f+24|0;t=f+20|0;o=f+16|0;m=f+12|0;n=f+8|0;w=f+4|0;l=f;c[g>>2]=a;c[x>>2]=b;c[u>>2]=d;c[p>>2]=e;c[h>>2]=c[(c[x>>2]|0)+4>>2];e=c[h>>2]|0;c[y>>2]=(c[h>>2]|0)>=0?e:0-e|0;c[q>>2]=((c[u>>2]|0)>>>0)/32|0;c[k>>2]=(c[y>>2]|0)-(c[q>>2]|0);if((c[k>>2]|0)<=0){c[c[(c[g>>2]|0)+8>>2]>>2]=1;if((c[h>>2]|0)==0){h=0}else{h=(c[h>>2]^c[p>>2]|0)<0?0:c[p>>2]|0}c[(c[g>>2]|0)+4>>2]=h;i=f;return}if(((((c[k>>2]|0)+1|0)>(c[c[g>>2]>>2]|0)|0)!=0|0)!=0){ee(c[g>>2]|0,(c[k>>2]|0)+1|0)|0}c[r>>2]=c[(c[x>>2]|0)+8>>2];c[s>>2]=0;c[t>>2]=(c[h>>2]^c[p>>2]|0)>=0?-1:0;a:do{if((c[t>>2]|0)!=0){c[v>>2]=0;while(1){if((c[v>>2]|0)>=(c[q>>2]|0)){break a}if((c[s>>2]|0)!=0){break a}c[s>>2]=c[(c[r>>2]|0)+(c[v>>2]<<2)>>2];c[v>>2]=(c[v>>2]|0)+1}}}while(0);c[j>>2]=c[(c[g>>2]|0)+8>>2];c[u>>2]=((c[u>>2]|0)>>>0)%32|0;if((c[u>>2]|0)==0){if((c[k>>2]|0)!=0){c[o>>2]=(c[k>>2]|0)-1;c[m>>2]=c[j>>2];c[n>>2]=(c[r>>2]|0)+(c[q>>2]<<2);a=c[n>>2]|0;c[n>>2]=a+4;c[w>>2]=c[a>>2];if((c[o>>2]|0)!=0){do{b=c[w>>2]|0;a=c[m>>2]|0;c[m>>2]=a+4;c[a>>2]=b;a=c[n>>2]|0;c[n>>2]=a+4;c[w>>2]=c[a>>2];a=(c[o>>2]|0)+ -1|0;c[o>>2]=a}while((a|0)!=0)}b=c[w>>2]|0;a=c[m>>2]|0;c[m>>2]=a+4;c[a>>2]=b}}else{a=c[t>>2]|0;a=a&(ye(c[j>>2]|0,(c[r>>2]|0)+(c[q>>2]<<2)|0,c[k>>2]|0,c[u>>2]|0)|0);c[s>>2]=c[s>>2]|a;c[k>>2]=(c[k>>2]|0)-((c[(c[j>>2]|0)+((c[k>>2]|0)-1<<2)>>2]|0)==0)}do{if((c[s>>2]|0)!=0){m=c[j>>2]|0;if((c[k>>2]|0)!=0){c[l>>2]=pe(m,c[j>>2]|0,c[k>>2]|0,1)|0;c[(c[j>>2]|0)+(c[k>>2]<<2)>>2]=c[l>>2];c[k>>2]=(c[k>>2]|0)+(c[l>>2]|0);break}else{c[m>>2]=1;c[k>>2]=1;break}}}while(0);j=c[k>>2]|0;c[(c[g>>2]|0)+4>>2]=(c[h>>2]|0)>=0?j:0-j|0;i=f;return}function Td(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+16|0;h=e+8|0;g=e+4|0;f=e;c[h>>2]=a;c[g>>2]=b;c[f>>2]=d;Sd(c[h>>2]|0,c[g>>2]|0,c[f>>2]|0,-1);i=e;return}function Ud(a){a=a|0;var b=0,d=0;b=i;i=i+16|0;d=b;c[d>>2]=a;qc[c[1840]&63](c[(c[d>>2]|0)+8>>2]|0,c[c[d>>2]>>2]<<2);i=b;return}function Vd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=i;i=i+64|0;d=f+48|0;q=f+44|0;n=f+40|0;e=f+36|0;s=f+32|0;r=f+28|0;p=f+24|0;k=f+20|0;g=f+16|0;h=f+12|0;l=f+8|0;m=f+4|0;o=f;c[q>>2]=a;c[n>>2]=b;c[e>>2]=c[(c[q>>2]|0)+4>>2];c[s>>2]=c[(c[n>>2]|0)+4>>2];c[r>>2]=(c[e>>2]|0)-(c[s>>2]|0);if((c[r>>2]|0)!=0){c[d>>2]=c[r>>2];s=c[d>>2]|0;i=f;return s|0}r=c[e>>2]|0;c[p>>2]=(c[e>>2]|0)>=0?r:0-r|0;c[k>>2]=c[(c[q>>2]|0)+8>>2];c[g>>2]=c[(c[n>>2]|0)+8>>2];c[h>>2]=0;c[l>>2]=c[p>>2];while(1){s=(c[l>>2]|0)+ -1|0;c[l>>2]=s;if((s|0)<0){break}c[m>>2]=c[(c[k>>2]|0)+(c[l>>2]<<2)>>2];c[o>>2]=c[(c[g>>2]|0)+(c[l>>2]<<2)>>2];if((c[m>>2]|0)!=(c[o>>2]|0)){j=6;break}}if((j|0)==6){c[h>>2]=(c[m>>2]|0)>>>0>(c[o>>2]|0)>>>0?1:-1}g=c[h>>2]|0;c[d>>2]=(c[e>>2]|0)>=0?g:0-g|0;s=c[d>>2]|0;i=f;return s|0}function Wd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;g=i;i=i+32|0;e=g+24|0;k=g+20|0;j=g+16|0;l=g+12|0;h=g+8|0;f=g+4|0;d=g;c[k>>2]=a;c[j>>2]=b;c[h>>2]=c[(c[k>>2]|0)+4>>2];c[l>>2]=((c[j>>2]|0)>0)-((c[j>>2]|0)<0);if(((c[h>>2]|0)==0|(c[h>>2]|0)!=(c[l>>2]|0)|0)!=0){c[e>>2]=(c[h>>2]|0)-(c[l>>2]|0);a=c[e>>2]|0;i=g;return a|0}c[f>>2]=c[c[(c[k>>2]|0)+8>>2]>>2];b=c[j>>2]|0;if((c[j>>2]|0)<0){b=0-(b+1-1)|0}c[d>>2]=b;if((c[f>>2]|0)==(c[d>>2]|0)){c[e>>2]=0;a=c[e>>2]|0;i=g;return a|0}h=c[h>>2]|0;if((c[f>>2]|0)>>>0>(c[d>>2]|0)>>>0){c[e>>2]=h;a=c[e>>2]|0;i=g;return a|0}else{c[e>>2]=0-h;a=c[e>>2]|0;i=g;return a|0}return 0}function Xd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;o=i;i=i+48|0;h=o+40|0;j=o+36|0;l=o+32|0;k=o+28|0;m=o+24|0;n=o+20|0;p=o+8|0;g=o+4|0;f=o;c[h>>2]=a;c[j>>2]=b;c[l>>2]=d;c[k>>2]=e;c[m>>2]=c[(c[k>>2]|0)+4>>2];c[g>>2]=0;if(!((c[h>>2]|0)!=(c[k>>2]|0)?(c[j>>2]|0)!=(c[k>>2]|0):0)){c[f>>2]=p;e=c[m>>2]|0;c[c[f>>2]>>2]=(c[m>>2]|0)>=0?e:0-e|0;e=c[m>>2]|0;d=c[m>>2]|0;d=((c[m>>2]|0)>=0?d:0-d|0)<<2;if(((((c[m>>2]|0)>=0?e:0-e|0)<<2>>>0<65536|0)!=0|0)!=0){e=i;i=i+((1*d|0)+15&-16)|0}else{e=Nd(g,d)|0}c[(c[f>>2]|0)+8>>2]=e;fe(p,c[k>>2]|0);c[k>>2]=p}c[n>>2]=c[(c[l>>2]|0)+4>>2]^c[m>>2];le(c[h>>2]|0,c[j>>2]|0,c[l>>2]|0,c[k>>2]|0);if((c[n>>2]|0)<0?(c[(c[j>>2]|0)+4>>2]|0)!=0:0){ke(c[h>>2]|0,c[h>>2]|0,1);Pd(c[j>>2]|0,c[j>>2]|0,c[k>>2]|0)}if((((c[g>>2]|0)!=0|0)!=0|0)==0){i=o;return}Od(c[g>>2]|0);i=o;return}function Yd(a){a=a|0;var b=0,d=0;b=i;i=i+16|0;d=b;c[d>>2]=a;c[c[d>>2]>>2]=1;a=sc[c[1836]&127](4)|0;c[(c[d>>2]|0)+8>>2]=a;c[(c[d>>2]|0)+4>>2]=0;i=b;return}function Zd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+48|0;j=f+36|0;o=f+32|0;d=f+28|0;l=f+24|0;k=f+20|0;g=f+16|0;h=f+12|0;e=f+8|0;m=f+4|0;n=f;c[j>>2]=a;c[o>>2]=b;c[k>>2]=c[(c[o>>2]|0)+4>>2];b=c[k>>2]|0;c[g>>2]=(c[k>>2]|0)>=0?b:0-b|0;c[c[j>>2]>>2]=(c[g>>2]|0)>1?c[g>>2]|0:1;a=sc[c[1836]&127](c[c[j>>2]>>2]<<2)|0;c[(c[j>>2]|0)+8>>2]=a;c[d>>2]=c[(c[j>>2]|0)+8>>2];c[l>>2]=c[(c[o>>2]|0)+8>>2];if((c[g>>2]|0)==0){b=c[k>>2]|0;a=c[j>>2]|0;a=a+4|0;c[a>>2]=b;i=f;return}c[h>>2]=(c[g>>2]|0)-1;c[e>>2]=c[d>>2];c[m>>2]=c[l>>2];a=c[m>>2]|0;c[m>>2]=a+4;c[n>>2]=c[a>>2];if((c[h>>2]|0)!=0){do{b=c[n>>2]|0;a=c[e>>2]|0;c[e>>2]=a+4;c[a>>2]=b;a=c[m>>2]|0;c[m>>2]=a+4;c[n>>2]=c[a>>2];a=(c[h>>2]|0)+ -1|0;c[h>>2]=a}while((a|0)!=0)}a=c[n>>2]|0;b=c[e>>2]|0;c[e>>2]=b+4;c[b>>2]=a;b=c[k>>2]|0;a=c[j>>2]|0;a=a+4|0;c[a>>2]=b;i=f;return}function _d(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;e=i;i=i+16|0;d=e+12|0;f=e+8|0;h=e+4|0;g=e;c[d>>2]=a;c[f>>2]=b;c[c[d>>2]>>2]=1;b=sc[c[1836]&127](4)|0;c[(c[d>>2]|0)+8>>2]=b;b=c[f>>2]|0;if((c[f>>2]|0)<0){b=0-(b+1-1)|0}c[g>>2]=b;c[c[(c[d>>2]|0)+8>>2]>>2]=c[g>>2];c[h>>2]=(c[g>>2]|0)!=0;g=c[h>>2]|0;c[(c[d>>2]|0)+4>>2]=(c[f>>2]|0)>=0?g:0-g|0;i=e;return}function $d(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+16|0;h=e+8|0;g=e+4|0;f=e;c[h>>2]=a;c[g>>2]=b;c[f>>2]=d;c[c[h>>2]>>2]=1;a=sc[c[1836]&127](4)|0;c[(c[h>>2]|0)+8>>2]=a;c[(c[h>>2]|0)+4>>2]=0;a=he(c[h>>2]|0,c[g>>2]|0,c[f>>2]|0)|0;i=e;return a|0}function ae(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;e=d+8|0;g=d+4|0;f=d;c[e>>2]=a;c[g>>2]=b;c[c[e>>2]>>2]=1;a=sc[c[1836]&127](4)|0;c[(c[e>>2]|0)+8>>2]=a;c[f>>2]=(c[g>>2]|0)!=0;c[c[(c[e>>2]|0)+8>>2]>>2]=c[g>>2];c[(c[e>>2]|0)+4>>2]=c[f>>2];i=d;return}function be(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;e=i;i=i+64|0;f=e+56|0;h=e+52|0;t=e+48|0;o=e+44|0;q=e+40|0;j=e+36|0;p=e+32|0;n=e+28|0;u=e+24|0;g=e+20|0;l=e+16|0;m=e+12|0;k=e+8|0;r=e+4|0;s=e;c[f>>2]=a;c[h>>2]=b;c[t>>2]=d;d=c[(c[h>>2]|0)+4>>2]|0;c[o>>2]=(c[(c[h>>2]|0)+4>>2]|0)>=0?d:0-d|0;c[j>>2]=((c[t>>2]|0)>>>0)/32|0;c[q>>2]=(c[o>>2]|0)+(c[j>>2]|0);if((c[o>>2]|0)==0){c[q>>2]=0;a=c[h>>2]|0;a=a+4|0;a=c[a>>2]|0;a=(a|0)>=0;g=c[q>>2]|0;h=0-g|0;b=a?g:h;a=c[f>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}d=c[f>>2]|0;if(((((c[q>>2]|0)+1|0)>(c[c[f>>2]>>2]|0)|0)!=0|0)!=0){d=ee(d,(c[q>>2]|0)+1|0)|0}else{d=c[d+8>>2]|0}c[p>>2]=d;c[n>>2]=c[(c[h>>2]|0)+8>>2];c[t>>2]=((c[t>>2]|0)>>>0)%32|0;if((c[t>>2]|0)==0){if((c[o>>2]|0)!=0){c[g>>2]=(c[o>>2]|0)-1;c[l>>2]=(c[p>>2]|0)+(c[j>>2]<<2)+(c[g>>2]<<2);c[m>>2]=(c[n>>2]|0)+(c[g>>2]<<2);a=c[m>>2]|0;c[m>>2]=a+ -4;c[k>>2]=c[a>>2];if((c[g>>2]|0)!=0){do{b=c[k>>2]|0;a=c[l>>2]|0;c[l>>2]=a+ -4;c[a>>2]=b;a=c[m>>2]|0;c[m>>2]=a+ -4;c[k>>2]=c[a>>2];a=(c[g>>2]|0)+ -1|0;c[g>>2]=a}while((a|0)!=0)}b=c[k>>2]|0;a=c[l>>2]|0;c[l>>2]=a+ -4;c[a>>2]=b}}else{c[u>>2]=xe((c[p>>2]|0)+(c[j>>2]<<2)|0,c[n>>2]|0,c[o>>2]|0,c[t>>2]|0)|0;c[(c[p>>2]|0)+(c[q>>2]<<2)>>2]=c[u>>2];c[q>>2]=(c[q>>2]|0)+((c[u>>2]|0)!=0)}if((c[j>>2]|0)==0){a=c[h>>2]|0;a=a+4|0;a=c[a>>2]|0;a=(a|0)>=0;g=c[q>>2]|0;h=0-g|0;b=a?g:h;a=c[f>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}c[r>>2]=c[p>>2];c[s>>2]=c[j>>2];do{a=c[r>>2]|0;c[r>>2]=a+4;c[a>>2]=0;a=(c[s>>2]|0)+ -1|0;c[s>>2]=a}while((a|0)!=0);a=c[h>>2]|0;a=a+4|0;a=c[a>>2]|0;a=(a|0)>=0;g=c[q>>2]|0;h=0-g|0;b=a?g:h;a=c[f>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}function ce(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+32|0;e=h+28|0;k=h+24|0;g=h+20|0;n=h+16|0;f=h+12|0;l=h+8|0;m=h+4|0;j=h;c[e>>2]=a;c[k>>2]=b;c[g>>2]=d;c[f>>2]=c[(c[k>>2]|0)+4>>2];if((c[f>>2]|0)!=0?(c[g>>2]|0)!=0:0){d=c[f>>2]|0;c[n>>2]=(c[f>>2]|0)>=0?d:0-d|0;c[l>>2]=c[g>>2];if((c[l>>2]|0)>>>0<=4294967295){d=c[e>>2]|0;if(((((c[n>>2]|0)+1|0)>(c[c[e>>2]>>2]|0)|0)!=0|0)!=0){d=ee(d,(c[n>>2]|0)+1|0)|0}else{d=c[d+8>>2]|0}c[j>>2]=d;c[m>>2]=ue(c[j>>2]|0,c[(c[k>>2]|0)+8>>2]|0,c[n>>2]|0,c[l>>2]|0)|0;c[(c[j>>2]|0)+(c[n>>2]<<2)>>2]=c[m>>2];c[n>>2]=(c[n>>2]|0)+((c[m>>2]|0)!=0)}j=c[n>>2]|0;c[(c[e>>2]|0)+4>>2]=((c[f>>2]|0)<0^(c[g>>2]|0)>>>0<0|0)!=0?0-j|0:j;i=h;return}c[(c[e>>2]|0)+4>>2]=0;i=h;return}function de(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,fa=0;j=i;i=i+208|0;g=j+204|0;y=j+200|0;J=j+196|0;t=j+192|0;m=j+188|0;L=j+184|0;S=j+180|0;n=j+176|0;h=j+172|0;u=j+168|0;H=j+164|0;W=j+160|0;ba=j+156|0;p=j+152|0;l=j+148|0;K=j+144|0;da=j+136|0;N=j+128|0;fa=j+124|0;ca=j+120|0;aa=j+116|0;Y=j+112|0;V=j+108|0;_=j+104|0;$=j+100|0;Z=j+96|0;U=j+92|0;T=j+88|0;R=j+84|0;Q=j+80|0;r=j+76|0;P=j+72|0;G=j+68|0;F=j+64|0;v=j+60|0;s=j+56|0;q=j+52|0;o=j+48|0;D=j+44|0;E=j+40|0;C=j+36|0;k=j+32|0;w=j+28|0;x=j+24|0;z=j+20|0;A=j+16|0;I=j+12|0;B=j+8|0;M=j+4|0;O=j;c[g>>2]=a;c[y>>2]=b;c[J>>2]=e;c[t>>2]=f;if((c[t>>2]|0)==0){c[c[(c[g>>2]|0)+8>>2]>>2]=1;c[(c[g>>2]|0)+4>>2]=1;i=j;return}if((c[J>>2]|0)==0){c[(c[g>>2]|0)+4>>2]=0;i=j;return}if((c[J>>2]|0)<0){f=(c[t>>2]&1|0)!=0}else{f=0}c[h>>2]=f&1;f=c[J>>2]|0;c[J>>2]=(c[J>>2]|0)>=0?f:0-f|0;c[ba>>2]=(c[(c[g>>2]|0)+8>>2]|0)==(c[y>>2]|0);c[L>>2]=0;c[p>>2]=c[c[y>>2]>>2];while(1){if((c[p>>2]|0)!=0){break}c[L>>2]=(c[L>>2]|0)+(c[t>>2]|0);c[J>>2]=(c[J>>2]|0)+ -1;e=(c[y>>2]|0)+4|0;c[y>>2]=e;c[p>>2]=c[e>>2]}c[fa>>2]=c[p>>2];if((((c[fa>>2]&255|0)!=0|0)!=0|0)!=0){c[W>>2]=(d[7496+(c[fa>>2]&0-(c[fa>>2]|0))|0]|0)-2}else{c[ca>>2]=6;while(1){if((c[ca>>2]|0)>=30){break}c[fa>>2]=(c[fa>>2]|0)>>>8;if((((c[fa>>2]&255|0)!=0|0)!=0|0)!=0){break}c[ca>>2]=(c[ca>>2]|0)+8}c[W>>2]=(c[ca>>2]|0)+(d[7496+(c[fa>>2]&0-(c[fa>>2]|0))|0]|0)}c[p>>2]=(c[p>>2]|0)>>>(c[W>>2]|0);c[K>>2]=ea(c[t>>2]|0,c[W>>2]|0)|0;c[L>>2]=(c[L>>2]|0)+(((c[K>>2]|0)>>>0)/32|0);c[K>>2]=((c[K>>2]|0)>>>0)%32|0;c[N>>2]=0;c[l>>2]=1;do{if((c[J>>2]|0)==1){X=18}else{if((c[J>>2]|0)==2){c[aa>>2]=c[(c[y>>2]|0)+4>>2];if((c[W>>2]|0)!=0){c[p>>2]=c[p>>2]|c[aa>>2]<<32-(c[W>>2]|0)}c[aa>>2]=(c[aa>>2]|0)>>>(c[W>>2]|0);if((c[aa>>2]|0)==0){c[J>>2]=1;X=18;break}else{c[y>>2]=da;c[da>>2]=c[p>>2];c[da+4>>2]=c[aa>>2];c[p>>2]=c[aa>>2];break}}if(!((c[ba>>2]|0)==0?(c[W>>2]|0)==0:0)){aa=c[J>>2]<<2;if(((c[J>>2]<<2>>>0<65536|0)!=0|0)!=0){e=i;i=i+((1*aa|0)+15&-16)|0;aa=e}else{aa=Nd(N,aa)|0}c[Y>>2]=aa;if((c[W>>2]|0)==0){if((c[J>>2]|0)!=0){c[V>>2]=(c[J>>2]|0)-1;c[_>>2]=c[Y>>2];c[$>>2]=c[y>>2];e=c[$>>2]|0;c[$>>2]=e+4;c[Z>>2]=c[e>>2];if((c[V>>2]|0)!=0){do{a=c[Z>>2]|0;e=c[_>>2]|0;c[_>>2]=e+4;c[e>>2]=a;e=c[$>>2]|0;c[$>>2]=e+4;c[Z>>2]=c[e>>2];e=(c[V>>2]|0)+ -1|0;c[V>>2]=e}while((e|0)!=0)}a=c[Z>>2]|0;e=c[_>>2]|0;c[_>>2]=e+4;c[e>>2]=a}}else{ye(c[Y>>2]|0,c[y>>2]|0,c[J>>2]|0,c[W>>2]|0)|0;c[J>>2]=(c[J>>2]|0)-((c[(c[Y>>2]|0)+((c[J>>2]|0)-1<<2)>>2]|0)==0)}c[y>>2]=c[Y>>2]}c[p>>2]=c[(c[y>>2]|0)+((c[J>>2]|0)-1<<2)>>2]}}while(0);if((X|0)==18){while(1){if(!((c[p>>2]|0)>>>0<=65535)){break}if((c[t>>2]&1|0)!=0){c[l>>2]=ea(c[l>>2]|0,c[p>>2]|0)|0}c[t>>2]=(c[t>>2]|0)>>>1;if((c[t>>2]|0)==0){break}c[p>>2]=ea(c[p>>2]|0,c[p>>2]|0)|0;X=18}if(((c[K>>2]|0)!=0?(c[l>>2]|0)!=1:0)?((c[l>>2]|0)>>>(32-(c[K>>2]|0)|0)|0)==0:0){c[l>>2]=c[l>>2]<<c[K>>2];c[K>>2]=0}}c[U>>2]=c[p>>2];V=c[U>>2]|0;if((c[U>>2]|0)>>>0<65536){V=V>>>0<256?1:9}else{V=V>>>0<16777216?17:25}c[T>>2]=V;c[H>>2]=33-(c[T>>2]|0)-(d[7496+((c[U>>2]|0)>>>(c[T>>2]|0))|0]|0);c[S>>2]=(((ea((c[J>>2]<<5)-(c[H>>2]|0)+0|0,c[t>>2]|0)|0)>>>0)/32|0)+5;T=c[g>>2]|0;if(((((c[S>>2]|0)+(c[L>>2]|0)|0)>(c[c[g>>2]>>2]|0)|0)!=0|0)!=0){T=ee(T,(c[S>>2]|0)+(c[L>>2]|0)|0)|0}else{T=c[T+8>>2]|0}c[m>>2]=T;if((c[L>>2]|0)!=0){c[R>>2]=c[m>>2];c[Q>>2]=c[L>>2];do{e=c[R>>2]|0;c[R>>2]=e+4;c[e>>2]=0;e=(c[Q>>2]|0)+ -1|0;c[Q>>2]=e}while((e|0)!=0)}c[m>>2]=(c[m>>2]|0)+(c[L>>2]<<2);a:do{if((c[t>>2]|0)==0){c[c[m>>2]>>2]=c[l>>2];c[n>>2]=1}else{c[P>>2]=c[S>>2];if(!((c[J>>2]|0)>1?(c[t>>2]&1|0)!=0:0)){c[P>>2]=(c[P>>2]|0)/2|0}Q=c[P>>2]<<2;if(((c[P>>2]<<2>>>0<65536|0)!=0|0)!=0){P=i;i=i+((1*Q|0)+15&-16)|0}else{P=Nd(N,Q)|0}c[r>>2]=P;c[G>>2]=c[t>>2];P=c[G>>2]|0;if((c[G>>2]|0)>>>0<65536){P=P>>>0<256?1:9}else{P=P>>>0<16777216?17:25}c[F>>2]=P;c[H>>2]=33-(c[F>>2]|0)-(d[7496+((c[G>>2]|0)>>>(c[F>>2]|0))|0]|0);c[u>>2]=32-(c[H>>2]|0)-2;if((c[J>>2]|0)==1){if((c[u>>2]&1|0)==0){c[v>>2]=c[m>>2];c[m>>2]=c[r>>2];c[r>>2]=c[v>>2]}c[c[m>>2]>>2]=c[p>>2];c[n>>2]=1;while(1){if((c[u>>2]|0)<0){break}Xe(c[r>>2]|0,c[m>>2]|0,c[n>>2]|0);c[n>>2]=c[n>>2]<<1;c[n>>2]=(c[n>>2]|0)-((c[(c[r>>2]|0)+((c[n>>2]|0)-1<<2)>>2]|0)==0);c[s>>2]=c[m>>2];c[m>>2]=c[r>>2];c[r>>2]=c[s>>2];if((c[t>>2]&1<<c[u>>2]|0)!=0){c[q>>2]=ue(c[m>>2]|0,c[m>>2]|0,c[n>>2]|0,c[p>>2]|0)|0;c[(c[m>>2]|0)+(c[n>>2]<<2)>>2]=c[q>>2];c[n>>2]=(c[n>>2]|0)+((c[q>>2]|0)!=0)}c[u>>2]=(c[u>>2]|0)+ -1}if((c[l>>2]|0)==1){break}c[o>>2]=ue(c[m>>2]|0,c[m>>2]|0,c[n>>2]|0,c[l>>2]|0)|0;c[(c[m>>2]|0)+(c[n>>2]<<2)>>2]=c[o>>2];c[n>>2]=(c[n>>2]|0)+((c[o>>2]|0)!=0);break}c[E>>2]=c[t>>2];c[C>>2]=0;do{c[C>>2]=c[C>>2]^-1771476586>>>(c[E>>2]&31);c[E>>2]=(c[E>>2]|0)>>>5}while((c[E>>2]|0)!=0);c[D>>2]=c[C>>2]&1;if(((c[D>>2]^c[u>>2])&1|0)!=0){c[k>>2]=c[m>>2];c[m>>2]=c[r>>2];c[r>>2]=c[k>>2]}if((c[J>>2]|0)!=0){c[w>>2]=(c[J>>2]|0)-1;c[x>>2]=c[m>>2];c[z>>2]=c[y>>2];e=c[z>>2]|0;c[z>>2]=e+4;c[A>>2]=c[e>>2];if((c[w>>2]|0)!=0){do{a=c[A>>2]|0;e=c[x>>2]|0;c[x>>2]=e+4;c[e>>2]=a;e=c[z>>2]|0;c[z>>2]=e+4;c[A>>2]=c[e>>2];e=(c[w>>2]|0)+ -1|0;c[w>>2]=e}while((e|0)!=0)}a=c[A>>2]|0;e=c[x>>2]|0;c[x>>2]=e+4;c[e>>2]=a}c[n>>2]=c[J>>2];while(1){if((c[u>>2]|0)<0){break a}Xe(c[r>>2]|0,c[m>>2]|0,c[n>>2]|0);c[n>>2]=c[n>>2]<<1;c[n>>2]=(c[n>>2]|0)-((c[(c[r>>2]|0)+((c[n>>2]|0)-1<<2)>>2]|0)==0);c[I>>2]=c[m>>2];c[m>>2]=c[r>>2];c[r>>2]=c[I>>2];if((c[t>>2]&1<<c[u>>2]|0)!=0){c[B>>2]=De(c[r>>2]|0,c[m>>2]|0,c[n>>2]|0,c[y>>2]|0,c[J>>2]|0)|0;c[n>>2]=(c[n>>2]|0)+((c[J>>2]|0)-((c[B>>2]|0)==0));c[M>>2]=c[m>>2];c[m>>2]=c[r>>2];c[r>>2]=c[M>>2]}c[u>>2]=(c[u>>2]|0)+ -1}}}while(0);if((((c[N>>2]|0)!=0|0)!=0|0)!=0){Od(c[N>>2]|0)}if((c[K>>2]|0)!=0){c[O>>2]=xe(c[m>>2]|0,c[m>>2]|0,c[n>>2]|0,c[K>>2]|0)|0;c[(c[m>>2]|0)+(c[n>>2]<<2)>>2]=c[O>>2];c[n>>2]=(c[n>>2]|0)+((c[O>>2]|0)!=0)}c[n>>2]=(c[n>>2]|0)+(c[L>>2]|0);k=c[n>>2]|0;c[(c[g>>2]|0)+4>>2]=(c[h>>2]|0)!=0?0-k|0:k;i=j;return}function ee(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;g=i;i=i+16|0;d=g+12|0;e=g+8|0;f=g+4|0;c[d>>2]=a;c[e>>2]=b;c[e>>2]=(c[e>>2]|0)>1?c[e>>2]|0:1;if((((c[e>>2]|0)>>>0>134217727|0)!=0|0)!=0){rb(c[q>>2]|0,8224,g|0)|0;Mb()}c[f>>2]=mc[c[1838]&31](c[(c[d>>2]|0)+8>>2]|0,c[c[d>>2]>>2]<<2,c[e>>2]<<2)|0;c[(c[d>>2]|0)+8>>2]=c[f>>2];c[c[d>>2]>>2]=c[e>>2];b=c[(c[d>>2]|0)+4>>2]|0;if((((c[(c[d>>2]|0)+4>>2]|0)>=0?b:0-b|0)|0)<=(c[e>>2]|0)){a=c[f>>2]|0;i=g;return a|0}c[(c[d>>2]|0)+4>>2]=0;a=c[f>>2]|0;i=g;return a|0}function fe(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+48|0;j=f+36|0;o=f+32|0;d=f+28|0;e=f+24|0;l=f+20|0;g=f+16|0;h=f+12|0;k=f+8|0;m=f+4|0;n=f;c[j>>2]=a;c[o>>2]=b;c[l>>2]=c[(c[o>>2]|0)+4>>2];b=c[l>>2]|0;c[g>>2]=(c[l>>2]|0)>=0?b:0-b|0;b=c[j>>2]|0;if((((c[g>>2]|0)>(c[c[j>>2]>>2]|0)|0)!=0|0)!=0){b=ee(b,c[g>>2]|0)|0}else{b=c[b+8>>2]|0}c[d>>2]=b;c[e>>2]=c[(c[o>>2]|0)+8>>2];if((c[g>>2]|0)==0){b=c[l>>2]|0;a=c[j>>2]|0;a=a+4|0;c[a>>2]=b;i=f;return}c[h>>2]=(c[g>>2]|0)-1;c[k>>2]=c[d>>2];c[m>>2]=c[e>>2];a=c[m>>2]|0;c[m>>2]=a+4;c[n>>2]=c[a>>2];if((c[h>>2]|0)!=0){do{b=c[n>>2]|0;a=c[k>>2]|0;c[k>>2]=a+4;c[a>>2]=b;a=c[m>>2]|0;c[m>>2]=a+4;c[n>>2]=c[a>>2];a=(c[h>>2]|0)+ -1|0;c[h>>2]=a}while((a|0)!=0)}a=c[n>>2]|0;b=c[k>>2]|0;c[k>>2]=b+4;c[b>>2]=a;b=c[l>>2]|0;a=c[j>>2]|0;a=a+4|0;c[a>>2]=b;i=f;return}function ge(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;e=i;i=i+16|0;d=e+12|0;f=e+8|0;h=e+4|0;g=e;c[d>>2]=a;c[f>>2]=b;b=c[f>>2]|0;if((c[f>>2]|0)<0){b=0-(b+1-1)|0}c[g>>2]=b;c[c[(c[d>>2]|0)+8>>2]>>2]=c[g>>2];c[h>>2]=(c[g>>2]|0)!=0;g=c[h>>2]|0;c[(c[d>>2]|0)+4>>2]=(c[f>>2]|0)>=0?g:0-g|0;i=e;return}function he(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;g=i;i=i+112|0;j=g+100|0;h=g+96|0;D=g+92|0;o=g+88|0;n=g+84|0;E=g+80|0;I=g+76|0;C=g+72|0;H=g+68|0;A=g+64|0;l=g+60|0;z=g+56|0;k=g+52|0;B=g+48|0;F=g+44|0;G=g+40|0;v=g+36|0;w=g+32|0;x=g+28|0;m=g+24|0;r=g+20|0;t=g+16|0;s=g+12|0;u=g+8|0;p=g+4|0;q=g;c[h>>2]=b;c[D>>2]=e;c[o>>2]=f;c[z>>2]=7632;if((c[o>>2]|0)>36?(c[z>>2]=(c[z>>2]|0)+208,(c[o>>2]|0)>62):0){c[j>>2]=-1;b=c[j>>2]|0;i=g;return b|0}do{b=c[D>>2]|0;c[D>>2]=b+1;c[A>>2]=d[b]|0}while((Ob(c[A>>2]|0)|0)!=0);c[l>>2]=0;if((c[A>>2]|0)==45){c[l>>2]=1;b=c[D>>2]|0;c[D>>2]=b+1;c[A>>2]=d[b]|0}if((d[(c[z>>2]|0)+(c[A>>2]|0)|0]|0|0)>=(((c[o>>2]|0)==0?10:c[o>>2]|0)|0)){c[j>>2]=-1;b=c[j>>2]|0;i=g;return b|0}do{if((c[o>>2]|0)==0?(c[o>>2]=10,(c[A>>2]|0)==48):0){c[o>>2]=8;b=c[D>>2]|0;c[D>>2]=b+1;c[A>>2]=d[b]|0;if((c[A>>2]|0)==120|(c[A>>2]|0)==88){c[o>>2]=16;b=c[D>>2]|0;c[D>>2]=b+1;c[A>>2]=d[b]|0;break}if((c[A>>2]|0)==98|(c[A>>2]|0)==66){c[o>>2]=2;b=c[D>>2]|0;c[D>>2]=b+1;c[A>>2]=d[b]|0}}}while(0);while(1){if((c[A>>2]|0)!=48?(Ob(c[A>>2]|0)|0)==0:0){break}b=c[D>>2]|0;c[D>>2]=b+1;c[A>>2]=d[b]|0}if((c[A>>2]|0)==0){c[(c[h>>2]|0)+4>>2]=0;c[j>>2]=0;b=c[j>>2]|0;i=g;return b|0}c[k>>2]=0;c[n>>2]=Cr((c[D>>2]|0)+ -1|0)|0;f=(c[n>>2]|0)+1|0;if(((((c[n>>2]|0)+1|0)>>>0<65536|0)!=0|0)!=0){b=i;i=i+((1*f|0)+15&-16)|0;f=b}else{f=Nd(k,f)|0}c[I>>2]=f;c[E>>2]=f;c[C>>2]=0;while(1){if(!((c[C>>2]|0)>>>0<(c[n>>2]|0)>>>0)){break}if((Ob(c[A>>2]|0)|0)==0){c[B>>2]=d[(c[z>>2]|0)+(c[A>>2]|0)|0]|0;if((c[B>>2]|0)>=(c[o>>2]|0)){y=27;break}e=c[B>>2]&255;b=c[E>>2]|0;c[E>>2]=b+1;a[b]=e}b=c[D>>2]|0;c[D>>2]=b+1;c[A>>2]=d[b]|0;c[C>>2]=(c[C>>2]|0)+1}if((y|0)==27){if((((c[k>>2]|0)!=0|0)!=0|0)!=0){Od(c[k>>2]|0)}c[j>>2]=-1;b=c[j>>2]|0;i=g;return b|0}c[n>>2]=(c[E>>2]|0)-(c[I>>2]|0);c[p>>2]=c[8264+((c[o>>2]|0)*20|0)>>2];c[q>>2]=c[n>>2];c[r>>2]=c[p>>2]&65535;c[s>>2]=(c[p>>2]|0)>>>16;c[t>>2]=c[q>>2]&65535;c[u>>2]=(c[q>>2]|0)>>>16;c[v>>2]=ea(c[r>>2]|0,c[t>>2]|0)|0;c[w>>2]=ea(c[r>>2]|0,c[u>>2]|0)|0;c[x>>2]=ea(c[s>>2]|0,c[t>>2]|0)|0;c[m>>2]=ea(c[s>>2]|0,c[u>>2]|0)|0;c[w>>2]=(c[w>>2]|0)+((c[v>>2]|0)>>>16);c[w>>2]=(c[w>>2]|0)+(c[x>>2]|0);if((c[w>>2]|0)>>>0<(c[x>>2]|0)>>>0){c[m>>2]=(c[m>>2]|0)+65536}c[F>>2]=(c[m>>2]|0)+((c[w>>2]|0)>>>16);c[G>>2]=(c[w>>2]<<16)+(c[v>>2]&65535);c[H>>2]=((c[F>>2]<<3>>>0)/32|0)+2;if((((c[H>>2]|0)>(c[c[h>>2]>>2]|0)|0)!=0|0)!=0){ee(c[h>>2]|0,c[H>>2]|0)|0}c[H>>2]=bf(c[(c[h>>2]|0)+8>>2]|0,c[I>>2]|0,c[n>>2]|0,c[o>>2]|0)|0;m=c[H>>2]|0;c[(c[h>>2]|0)+4>>2]=(c[l>>2]|0)!=0?0-m|0:m;if((((c[k>>2]|0)!=0|0)!=0|0)!=0){Od(c[k>>2]|0)}c[j>>2]=0;b=c[j>>2]|0;i=g;return b|0}function ie(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;p=i;i=i+96|0;w=p+80|0;g=p+76|0;s=p+72|0;h=p+68|0;v=p+64|0;j=p+60|0;y=p+56|0;z=p+52|0;x=p+48|0;k=p+40|0;r=p+36|0;f=p+32|0;t=p+28|0;u=p+24|0;n=p+20|0;e=p+16|0;o=p+12|0;q=p+8|0;l=p+4|0;m=p;c[w>>2]=a;c[g>>2]=b;b=c[(c[w>>2]|0)+4>>2]|0;if((((c[(c[w>>2]|0)+4>>2]|0)>=0?b:0-b|0)|0)==0){c[s>>2]=1;a=c[s>>2]|0;i=p;return a|0}b=c[(c[w>>2]|0)+4>>2]|0;c[y>>2]=c[(c[(c[w>>2]|0)+8>>2]|0)+(((c[(c[w>>2]|0)+4>>2]|0)>=0?b:0-b|0)-1<<2)>>2];b=c[y>>2]|0;if((c[y>>2]|0)>>>0<65536){b=b>>>0<256?1:9}else{b=b>>>0<16777216?17:25}c[z>>2]=b;c[v>>2]=33-(c[z>>2]|0)-(d[7496+((c[y>>2]|0)>>>(c[z>>2]|0))|0]|0);y=c[(c[w>>2]|0)+4>>2]|0;c[j>>2]=(((c[(c[w>>2]|0)+4>>2]|0)>=0?y:0-y|0)<<5)-((c[v>>2]|0)-0);if((c[g>>2]&(c[g>>2]|0)-1|0)==0){c[h>>2]=c[8268+((c[g>>2]|0)*20|0)>>2];c[s>>2]=(((c[j>>2]|0)+(c[h>>2]|0)-1|0)>>>0)/((c[h>>2]|0)>>>0)|0;a=c[s>>2]|0;i=p;return a|0}c[k>>2]=c[j>>2];c[l>>2]=(c[8260+((c[g>>2]|0)*20|0)>>2]|0)+1;c[m>>2]=c[k>>2];c[n>>2]=c[l>>2]&65535;c[o>>2]=(c[l>>2]|0)>>>16;c[e>>2]=c[m>>2]&65535;c[q>>2]=(c[m>>2]|0)>>>16;c[r>>2]=ea(c[n>>2]|0,c[e>>2]|0)|0;c[f>>2]=ea(c[n>>2]|0,c[q>>2]|0)|0;c[t>>2]=ea(c[o>>2]|0,c[e>>2]|0)|0;c[u>>2]=ea(c[o>>2]|0,c[q>>2]|0)|0;c[f>>2]=(c[f>>2]|0)+((c[r>>2]|0)>>>16);c[f>>2]=(c[f>>2]|0)+(c[t>>2]|0);if((c[f>>2]|0)>>>0<(c[t>>2]|0)>>>0){c[u>>2]=(c[u>>2]|0)+65536}c[x>>2]=(c[u>>2]|0)+((c[f>>2]|0)>>>16);c[p+44>>2]=(c[f>>2]<<16)+(c[r>>2]&65535);c[s>>2]=(c[x>>2]|0)+1;a=c[s>>2]|0;i=p;return a|0}function je(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;e=i;i=i+64|0;k=e+56|0;p=e+52|0;q=e+48|0;g=e+44|0;j=e+40|0;f=e+36|0;l=e+32|0;r=e+28|0;m=e+24|0;h=e+20|0;o=e+16|0;s=e+12|0;t=e+8|0;u=e+4|0;n=e;c[k>>2]=a;c[p>>2]=b;c[q>>2]=d;c[l>>2]=c[(c[p>>2]|0)+4>>2];c[r>>2]=0-(c[(c[q>>2]|0)+4>>2]|0);d=c[l>>2]|0;c[h>>2]=(c[l>>2]|0)>=0?d:0-d|0;d=c[r>>2]|0;c[o>>2]=(c[r>>2]|0)>=0?d:0-d|0;if((c[h>>2]|0)<(c[o>>2]|0)){c[s>>2]=c[p>>2];c[p>>2]=c[q>>2];c[q>>2]=c[s>>2];c[t>>2]=c[l>>2];c[l>>2]=c[r>>2];c[r>>2]=c[t>>2];c[u>>2]=c[h>>2];c[h>>2]=c[o>>2];c[o>>2]=c[u>>2]}c[m>>2]=(c[h>>2]|0)+1;s=c[k>>2]|0;if((((c[m>>2]|0)>(c[c[k>>2]>>2]|0)|0)!=0|0)!=0){s=ee(s,c[m>>2]|0)|0}else{s=c[s+8>>2]|0}c[f>>2]=s;c[g>>2]=c[(c[p>>2]|0)+8>>2];c[j>>2]=c[(c[q>>2]|0)+8>>2];if((c[l>>2]^c[r>>2]|0)>=0){c[n>>2]=oe(c[f>>2]|0,c[g>>2]|0,c[h>>2]|0,c[j>>2]|0,c[o>>2]|0)|0;c[(c[f>>2]|0)+(c[h>>2]<<2)>>2]=c[n>>2];c[m>>2]=(c[h>>2]|0)+(c[n>>2]|0);if((c[l>>2]|0)>=0){b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}c[m>>2]=0-(c[m>>2]|0);b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}if((c[h>>2]|0)!=(c[o>>2]|0)){re(c[f>>2]|0,c[g>>2]|0,c[h>>2]|0,c[j>>2]|0,c[o>>2]|0)|0;c[m>>2]=c[h>>2];while(1){if((c[m>>2]|0)<=0){break}if((c[(c[f>>2]|0)+((c[m>>2]|0)-1<<2)>>2]|0)!=0){break}c[m>>2]=(c[m>>2]|0)+ -1}if((c[l>>2]|0)>=0){b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}c[m>>2]=0-(c[m>>2]|0);b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}a=(ff(c[g>>2]|0,c[j>>2]|0,c[h>>2]|0)|0)<0;n=c[f>>2]|0;if(a){te(n,c[j>>2]|0,c[g>>2]|0,c[h>>2]|0)|0;c[m>>2]=c[h>>2];while(1){if((c[m>>2]|0)<=0){break}if((c[(c[f>>2]|0)+((c[m>>2]|0)-1<<2)>>2]|0)!=0){break}c[m>>2]=(c[m>>2]|0)+ -1}if((c[l>>2]|0)<0){b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}c[m>>2]=0-(c[m>>2]|0);b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}else{te(n,c[g>>2]|0,c[j>>2]|0,c[h>>2]|0)|0;c[m>>2]=c[h>>2];while(1){if((c[m>>2]|0)<=0){break}if((c[(c[f>>2]|0)+((c[m>>2]|0)-1<<2)>>2]|0)!=0){break}c[m>>2]=(c[m>>2]|0)+ -1}if((c[l>>2]|0)>=0){b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}c[m>>2]=0-(c[m>>2]|0);b=c[m>>2]|0;a=c[k>>2]|0;a=a+4|0;c[a>>2]=b;i=e;return}}function ke(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;m=i;i=i+48|0;f=m+32|0;n=m+28|0;g=m+24|0;k=m+20|0;j=m+16|0;o=m+12|0;h=m+8|0;l=m+4|0;e=m;c[f>>2]=a;c[n>>2]=b;c[g>>2]=d;c[o>>2]=c[(c[n>>2]|0)+4>>2];if((c[o>>2]|0)==0){c[c[(c[f>>2]|0)+8>>2]>>2]=c[g>>2];c[(c[f>>2]|0)+4>>2]=0-((c[g>>2]|0)!=0);i=m;return}d=c[o>>2]|0;c[l>>2]=(c[o>>2]|0)>=0?d:0-d|0;d=c[f>>2]|0;if(((((c[l>>2]|0)+1|0)>(c[c[f>>2]>>2]|0)|0)!=0|0)!=0){d=ee(d,(c[l>>2]|0)+1|0)|0}else{d=c[d+8>>2]|0}c[j>>2]=d;c[k>>2]=c[(c[n>>2]|0)+8>>2];do{if((c[o>>2]|0)<0){c[e>>2]=pe(c[j>>2]|0,c[k>>2]|0,c[l>>2]|0,c[g>>2]|0)|0;c[(c[j>>2]|0)+(c[l>>2]<<2)>>2]=c[e>>2];c[h>>2]=0-((c[l>>2]|0)+(c[e>>2]|0))}else{if((c[l>>2]|0)==1?(c[c[k>>2]>>2]|0)>>>0<(c[g>>2]|0)>>>0:0){c[c[j>>2]>>2]=(c[g>>2]|0)-(c[c[k>>2]>>2]|0);c[h>>2]=-1;break}se(c[j>>2]|0,c[k>>2]|0,c[l>>2]|0,c[g>>2]|0)|0;c[h>>2]=(c[l>>2]|0)-((c[(c[j>>2]|0)+((c[l>>2]|0)-1<<2)>>2]|0)==0)}}while(0);c[(c[f>>2]|0)+4>>2]=c[h>>2];i=m;return}function le(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;g=i;i=i+112|0;l=g+108|0;h=g+104|0;D=g+100|0;E=g+96|0;r=g+92|0;j=g+88|0;m=g+84|0;s=g+80|0;k=g+76|0;q=g+72|0;w=g+68|0;v=g+64|0;n=g+60|0;f=g+56|0;I=g+52|0;F=g+48|0;G=g+44|0;H=g+40|0;y=g+36|0;z=g+32|0;B=g+28|0;A=g+24|0;C=g+20|0;x=g+16|0;o=g+12|0;p=g+8|0;t=g+4|0;u=g;c[l>>2]=a;c[h>>2]=b;c[D>>2]=d;c[E>>2]=e;c[j>>2]=c[(c[D>>2]|0)+4>>2];c[m>>2]=c[(c[E>>2]|0)+4>>2];e=c[j>>2]|0;c[s>>2]=(c[j>>2]|0)>=0?e:0-e|0;e=c[m>>2]|0;c[k>>2]=(c[m>>2]|0)>=0?e:0-e|0;c[r>>2]=(c[s>>2]|0)-(c[k>>2]|0)+1;if((((c[k>>2]|0)==0|0)!=0|0)!=0){Jd()}e=c[h>>2]|0;if((((c[k>>2]|0)>(c[c[h>>2]>>2]|0)|0)!=0|0)!=0){e=ee(e,c[k>>2]|0)|0}else{e=c[e+8>>2]|0}c[n>>2]=e;if((c[r>>2]|0)<=0){if((c[D>>2]|0)!=(c[h>>2]|0)){c[q>>2]=c[(c[D>>2]|0)+8>>2];if((c[s>>2]|0)!=0){c[I>>2]=(c[s>>2]|0)-1;c[F>>2]=c[n>>2];c[G>>2]=c[q>>2];a=c[G>>2]|0;c[G>>2]=a+4;c[H>>2]=c[a>>2];if((c[I>>2]|0)!=0){do{b=c[H>>2]|0;a=c[F>>2]|0;c[F>>2]=a+4;c[a>>2]=b;a=c[G>>2]|0;c[G>>2]=a+4;c[H>>2]=c[a>>2];a=(c[I>>2]|0)+ -1|0;c[I>>2]=a}while((a|0)!=0)}b=c[H>>2]|0;a=c[F>>2]|0;c[F>>2]=a+4;c[a>>2]=b}c[(c[h>>2]|0)+4>>2]=c[(c[D>>2]|0)+4>>2]}c[(c[l>>2]|0)+4>>2]=0;i=g;return}F=c[l>>2]|0;if((((c[r>>2]|0)>(c[c[l>>2]>>2]|0)|0)!=0|0)!=0){F=ee(F,c[r>>2]|0)|0}else{F=c[F+8>>2]|0}c[v>>2]=F;c[f>>2]=0;c[q>>2]=c[(c[D>>2]|0)+8>>2];c[w>>2]=c[(c[E>>2]|0)+8>>2];if(!((c[w>>2]|0)!=(c[n>>2]|0)?(c[w>>2]|0)!=(c[v>>2]|0):0)){D=c[k>>2]<<2;if(((c[k>>2]<<2>>>0<65536|0)!=0|0)!=0){a=i;i=i+((1*D|0)+15&-16)|0;D=a}else{D=Nd(f,D)|0}c[y>>2]=D;if((c[k>>2]|0)!=0){c[z>>2]=(c[k>>2]|0)-1;c[B>>2]=c[y>>2];c[A>>2]=c[w>>2];a=c[A>>2]|0;c[A>>2]=a+4;c[C>>2]=c[a>>2];if((c[z>>2]|0)!=0){do{b=c[C>>2]|0;a=c[B>>2]|0;c[B>>2]=a+4;c[a>>2]=b;a=c[A>>2]|0;c[A>>2]=a+4;c[C>>2]=c[a>>2];a=(c[z>>2]|0)+ -1|0;c[z>>2]=a}while((a|0)!=0)}b=c[C>>2]|0;a=c[B>>2]|0;c[B>>2]=a+4;c[a>>2]=b}c[w>>2]=c[y>>2]}if(!((c[q>>2]|0)!=(c[n>>2]|0)?(c[q>>2]|0)!=(c[v>>2]|0):0)){y=c[s>>2]<<2;if(((c[s>>2]<<2>>>0<65536|0)!=0|0)!=0){a=i;i=i+((1*y|0)+15&-16)|0;y=a}else{y=Nd(f,y)|0}c[x>>2]=y;if((c[s>>2]|0)!=0){c[o>>2]=(c[s>>2]|0)-1;c[p>>2]=c[x>>2];c[t>>2]=c[q>>2];a=c[t>>2]|0;c[t>>2]=a+4;c[u>>2]=c[a>>2];if((c[o>>2]|0)!=0){do{b=c[u>>2]|0;a=c[p>>2]|0;c[p>>2]=a+4;c[a>>2]=b;a=c[t>>2]|0;c[t>>2]=a+4;c[u>>2]=c[a>>2];a=(c[o>>2]|0)+ -1|0;c[o>>2]=a}while((a|0)!=0)}b=c[u>>2]|0;a=c[p>>2]|0;c[p>>2]=a+4;c[a>>2]=b}c[q>>2]=c[x>>2]}gf(c[v>>2]|0,c[n>>2]|0,0,c[q>>2]|0,c[s>>2]|0,c[w>>2]|0,c[k>>2]|0);c[r>>2]=(c[r>>2]|0)-((c[(c[v>>2]|0)+((c[r>>2]|0)-1<<2)>>2]|0)==0);while(1){if((c[k>>2]|0)<=0){break}if((c[(c[n>>2]|0)+((c[k>>2]|0)-1<<2)>>2]|0)!=0){break}c[k>>2]=(c[k>>2]|0)+ -1}n=c[r>>2]|0;c[(c[l>>2]|0)+4>>2]=(c[j>>2]^c[m>>2]|0)>=0?n:0-n|0;k=c[k>>2]|0;c[(c[h>>2]|0)+4>>2]=(c[j>>2]|0)>=0?k:0-k|0;if((((c[f>>2]|0)!=0|0)!=0|0)==0){i=g;return}Od(c[f>>2]|0);i=g;return}function me(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;f=i;i=i+112|0;g=f+104|0;z=f+100|0;A=f+96|0;B=f+92|0;e=f+88|0;G=f+84|0;t=f+80|0;j=f+76|0;k=f+72|0;s=f+68|0;r=f+64|0;o=f+60|0;h=f+56|0;D=f+52|0;C=f+48|0;F=f+44|0;E=f+40|0;u=f+36|0;x=f+32|0;v=f+28|0;w=f+24|0;y=f+20|0;p=f+16|0;n=f+12|0;m=f+8|0;l=f+4|0;q=f;c[g>>2]=a;c[z>>2]=b;c[A>>2]=d;c[e>>2]=c[(c[z>>2]|0)+4>>2];c[G>>2]=c[(c[A>>2]|0)+4>>2];d=c[e>>2]|0;c[t>>2]=(c[e>>2]|0)>=0?d:0-d|0;d=c[G>>2]|0;c[j>>2]=(c[G>>2]|0)>=0?d:0-d|0;c[B>>2]=(c[t>>2]|0)-(c[j>>2]|0)+1;if((((c[j>>2]|0)==0|0)!=0|0)!=0){Jd()}G=c[g>>2]|0;if((((c[j>>2]|0)>(c[c[g>>2]>>2]|0)|0)!=0|0)!=0){G=ee(G,c[j>>2]|0)|0}else{G=c[G+8>>2]|0}c[o>>2]=G;if((c[B>>2]|0)<=0){if((c[z>>2]|0)==(c[g>>2]|0)){i=f;return}c[k>>2]=c[(c[z>>2]|0)+8>>2];if((c[t>>2]|0)!=0){c[D>>2]=(c[t>>2]|0)-1;c[C>>2]=c[o>>2];c[F>>2]=c[k>>2];a=c[F>>2]|0;c[F>>2]=a+4;c[E>>2]=c[a>>2];if((c[D>>2]|0)!=0){do{b=c[E>>2]|0;a=c[C>>2]|0;c[C>>2]=a+4;c[a>>2]=b;a=c[F>>2]|0;c[F>>2]=a+4;c[E>>2]=c[a>>2];a=(c[D>>2]|0)+ -1|0;c[D>>2]=a}while((a|0)!=0)}b=c[E>>2]|0;a=c[C>>2]|0;c[C>>2]=a+4;c[a>>2]=b}c[(c[g>>2]|0)+4>>2]=c[(c[z>>2]|0)+4>>2];i=f;return}c[h>>2]=0;C=c[B>>2]<<2;if(((c[B>>2]<<2>>>0<65536|0)!=0|0)!=0){B=i;i=i+((1*C|0)+15&-16)|0}else{B=Nd(h,C)|0}c[r>>2]=B;c[k>>2]=c[(c[z>>2]|0)+8>>2];c[s>>2]=c[(c[A>>2]|0)+8>>2];if((c[s>>2]|0)==(c[o>>2]|0)){z=c[j>>2]<<2;if(((c[j>>2]<<2>>>0<65536|0)!=0|0)!=0){a=i;i=i+((1*z|0)+15&-16)|0;z=a}else{z=Nd(h,z)|0}c[u>>2]=z;if((c[j>>2]|0)!=0){c[x>>2]=(c[j>>2]|0)-1;c[v>>2]=c[u>>2];c[w>>2]=c[s>>2];a=c[w>>2]|0;c[w>>2]=a+4;c[y>>2]=c[a>>2];if((c[x>>2]|0)!=0){do{b=c[y>>2]|0;a=c[v>>2]|0;c[v>>2]=a+4;c[a>>2]=b;a=c[w>>2]|0;c[w>>2]=a+4;c[y>>2]=c[a>>2];a=(c[x>>2]|0)+ -1|0;c[x>>2]=a}while((a|0)!=0)}b=c[y>>2]|0;a=c[v>>2]|0;c[v>>2]=a+4;c[a>>2]=b}c[s>>2]=c[u>>2]}if((c[k>>2]|0)==(c[o>>2]|0)){u=c[t>>2]<<2;if(((c[t>>2]<<2>>>0<65536|0)!=0|0)!=0){a=i;i=i+((1*u|0)+15&-16)|0;u=a}else{u=Nd(h,u)|0}c[p>>2]=u;if((c[t>>2]|0)!=0){c[n>>2]=(c[t>>2]|0)-1;c[m>>2]=c[p>>2];c[l>>2]=c[k>>2];a=c[l>>2]|0;c[l>>2]=a+4;c[q>>2]=c[a>>2];if((c[n>>2]|0)!=0){do{b=c[q>>2]|0;a=c[m>>2]|0;c[m>>2]=a+4;c[a>>2]=b;a=c[l>>2]|0;c[l>>2]=a+4;c[q>>2]=c[a>>2];a=(c[n>>2]|0)+ -1|0;c[n>>2]=a}while((a|0)!=0)}b=c[q>>2]|0;a=c[m>>2]|0;c[m>>2]=a+4;c[a>>2]=b}c[k>>2]=c[p>>2]}gf(c[r>>2]|0,c[o>>2]|0,0,c[k>>2]|0,c[t>>2]|0,c[s>>2]|0,c[j>>2]|0);while(1){if((c[j>>2]|0)<=0){break}if((c[(c[o>>2]|0)+((c[j>>2]|0)-1<<2)>>2]|0)!=0){break}c[j>>2]=(c[j>>2]|0)+ -1}j=c[j>>2]|0;c[(c[g>>2]|0)+4>>2]=(c[e>>2]|0)>=0?j:0-j|0;if((((c[h>>2]|0)!=0|0)!=0|0)==0){i=f;return}Od(c[h>>2]|0);i=f;return}function ne(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+16|0;h=e+8|0;g=e+4|0;f=e;c[h>>2]=a;c[g>>2]=b;c[f>>2]=d;de(c[h>>2]|0,g,(c[g>>2]|0)!=0|0,c[f>>2]|0);i=e;return}function oe(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;h=i;i=i+48|0;j=h+32|0;k=h+28|0;g=h+24|0;p=h+20|0;q=h+16|0;n=h+12|0;l=h+8|0;m=h+4|0;o=h;c[j>>2]=a;c[k>>2]=b;c[g>>2]=d;c[p>>2]=e;c[q>>2]=f;c[l>>2]=c[q>>2];a:do{if((c[l>>2]|0)!=0?(qe(c[j>>2]|0,c[k>>2]|0,c[p>>2]|0,c[l>>2]|0)|0)!=0:0){while(1){if((c[l>>2]|0)>=(c[g>>2]|0)){break}c[m>>2]=c[(c[k>>2]|0)+(c[l>>2]<<2)>>2];q=(c[m>>2]|0)+1|0;a=c[l>>2]|0;c[l>>2]=a+1;c[(c[j>>2]|0)+(a<<2)>>2]=q;if((q|0)!=0){break a}}c[n>>2]=1;q=c[n>>2]|0;i=h;return q|0}}while(0);b:do{if((c[j>>2]|0)!=(c[k>>2]|0)){c[o>>2]=c[l>>2];while(1){if((c[o>>2]|0)>=(c[g>>2]|0)){break b}c[(c[j>>2]|0)+(c[o>>2]<<2)>>2]=c[(c[k>>2]|0)+(c[o>>2]<<2)>>2];c[o>>2]=(c[o>>2]|0)+1}}}while(0);c[n>>2]=0;q=c[n>>2]|0;i=h;return q|0}function pe(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;h=i;i=i+48|0;m=h+36|0;l=h+32|0;k=h+28|0;r=h+24|0;n=h+20|0;f=h+16|0;p=h+12|0;q=h+8|0;o=h+4|0;j=h;c[m>>2]=a;c[l>>2]=b;c[k>>2]=d;c[r>>2]=e;c[p>>2]=c[c[l>>2]>>2];c[q>>2]=(c[p>>2]|0)+(c[r>>2]|0);c[c[m>>2]>>2]=c[q>>2];if(!((c[q>>2]|0)>>>0<(c[r>>2]|0)>>>0)){a:do{if((c[l>>2]|0)!=(c[m>>2]|0)){c[j>>2]=1;while(1){if((c[j>>2]|0)>=(c[k>>2]|0)){break a}c[(c[m>>2]|0)+(c[j>>2]<<2)>>2]=c[(c[l>>2]|0)+(c[j>>2]<<2)>>2];c[j>>2]=(c[j>>2]|0)+1}}}while(0);c[n>>2]=0;r=c[n>>2]|0;i=h;return r|0}c[n>>2]=1;c[f>>2]=1;do{if((c[f>>2]|0)>=(c[k>>2]|0)){g=15;break}c[p>>2]=c[(c[l>>2]|0)+(c[f>>2]<<2)>>2];c[q>>2]=(c[p>>2]|0)+1;c[(c[m>>2]|0)+(c[f>>2]<<2)>>2]=c[q>>2];c[f>>2]=(c[f>>2]|0)+1}while((c[q>>2]|0)>>>0<1);if((g|0)==15){r=c[n>>2]|0;i=h;return r|0}b:do{if((c[l>>2]|0)!=(c[m>>2]|0)){c[o>>2]=c[f>>2];while(1){if((c[o>>2]|0)>=(c[k>>2]|0)){break b}c[(c[m>>2]|0)+(c[o>>2]<<2)>>2]=c[(c[l>>2]|0)+(c[o>>2]<<2)>>2];c[o>>2]=(c[o>>2]|0)+1}}}while(0);c[n>>2]=0;r=c[n>>2]|0;i=h;return r|0}function qe(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;n=i;i=i+48|0;q=n+40|0;h=n+36|0;k=n+32|0;r=n+28|0;j=n+24|0;l=n+20|0;m=n+16|0;o=n+12|0;g=n+8|0;f=n+4|0;p=n;c[q>>2]=a;c[h>>2]=b;c[k>>2]=d;c[r>>2]=e;c[g>>2]=0;do{b=c[h>>2]|0;c[h>>2]=b+4;c[j>>2]=c[b>>2];b=c[k>>2]|0;c[k>>2]=b+4;c[l>>2]=c[b>>2];c[m>>2]=(c[j>>2]|0)+(c[l>>2]|0);c[f>>2]=(c[m>>2]|0)>>>0<(c[j>>2]|0)>>>0;c[o>>2]=(c[m>>2]|0)+(c[g>>2]|0);c[p>>2]=(c[o>>2]|0)>>>0<(c[m>>2]|0)>>>0;c[g>>2]=c[f>>2]|c[p>>2];b=c[o>>2]|0;a=c[q>>2]|0;c[q>>2]=a+4;c[a>>2]=b;a=(c[r>>2]|0)+ -1|0;c[r>>2]=a}while((a|0)!=0);i=n;return c[g>>2]|0}function re(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;h=i;i=i+48|0;j=h+32|0;k=h+28|0;g=h+24|0;p=h+20|0;q=h+16|0;n=h+12|0;l=h+8|0;m=h+4|0;o=h;c[j>>2]=a;c[k>>2]=b;c[g>>2]=d;c[p>>2]=e;c[q>>2]=f;c[l>>2]=c[q>>2];a:do{if((c[l>>2]|0)!=0?(te(c[j>>2]|0,c[k>>2]|0,c[p>>2]|0,c[l>>2]|0)|0)!=0:0){while(1){if((c[l>>2]|0)>=(c[g>>2]|0)){break}c[m>>2]=c[(c[k>>2]|0)+(c[l>>2]<<2)>>2];a=(c[m>>2]|0)-1|0;q=c[l>>2]|0;c[l>>2]=q+1;c[(c[j>>2]|0)+(q<<2)>>2]=a;if((c[m>>2]|0)!=0){break a}}c[n>>2]=1;q=c[n>>2]|0;i=h;return q|0}}while(0);b:do{if((c[j>>2]|0)!=(c[k>>2]|0)){c[o>>2]=c[l>>2];while(1){if((c[o>>2]|0)>=(c[g>>2]|0)){break b}c[(c[j>>2]|0)+(c[o>>2]<<2)>>2]=c[(c[k>>2]|0)+(c[o>>2]<<2)>>2];c[o>>2]=(c[o>>2]|0)+1}}}while(0);c[n>>2]=0;q=c[n>>2]|0;i=h;return q|0}function se(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;h=i;i=i+48|0;m=h+36|0;l=h+32|0;k=h+28|0;r=h+24|0;n=h+20|0;f=h+16|0;p=h+12|0;q=h+8|0;o=h+4|0;j=h;c[m>>2]=a;c[l>>2]=b;c[k>>2]=d;c[r>>2]=e;c[p>>2]=c[c[l>>2]>>2];c[q>>2]=(c[p>>2]|0)-(c[r>>2]|0);c[c[m>>2]>>2]=c[q>>2];if(!((c[p>>2]|0)>>>0<(c[r>>2]|0)>>>0)){a:do{if((c[l>>2]|0)!=(c[m>>2]|0)){c[j>>2]=1;while(1){if((c[j>>2]|0)>=(c[k>>2]|0)){break a}c[(c[m>>2]|0)+(c[j>>2]<<2)>>2]=c[(c[l>>2]|0)+(c[j>>2]<<2)>>2];c[j>>2]=(c[j>>2]|0)+1}}}while(0);c[n>>2]=0;r=c[n>>2]|0;i=h;return r|0}c[n>>2]=1;c[f>>2]=1;do{if((c[f>>2]|0)>=(c[k>>2]|0)){g=15;break}c[p>>2]=c[(c[l>>2]|0)+(c[f>>2]<<2)>>2];c[q>>2]=(c[p>>2]|0)-1;c[(c[m>>2]|0)+(c[f>>2]<<2)>>2]=c[q>>2];c[f>>2]=(c[f>>2]|0)+1}while((c[p>>2]|0)>>>0<1);if((g|0)==15){r=c[n>>2]|0;i=h;return r|0}b:do{if((c[l>>2]|0)!=(c[m>>2]|0)){c[o>>2]=c[f>>2];while(1){if((c[o>>2]|0)>=(c[k>>2]|0)){break b}c[(c[m>>2]|0)+(c[o>>2]<<2)>>2]=c[(c[l>>2]|0)+(c[o>>2]<<2)>>2];c[o>>2]=(c[o>>2]|0)+1}}}while(0);c[n>>2]=0;r=c[n>>2]|0;i=h;return r|0}function te(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;n=i;i=i+48|0;q=n+40|0;h=n+36|0;k=n+32|0;r=n+28|0;j=n+24|0;l=n+20|0;m=n+16|0;o=n+12|0;g=n+8|0;f=n+4|0;p=n;c[q>>2]=a;c[h>>2]=b;c[k>>2]=d;c[r>>2]=e;c[g>>2]=0;do{b=c[h>>2]|0;c[h>>2]=b+4;c[j>>2]=c[b>>2];b=c[k>>2]|0;c[k>>2]=b+4;c[l>>2]=c[b>>2];c[m>>2]=(c[j>>2]|0)-(c[l>>2]|0);c[f>>2]=(c[m>>2]|0)>>>0>(c[j>>2]|0)>>>0;c[o>>2]=(c[m>>2]|0)-(c[g>>2]|0);c[p>>2]=(c[o>>2]|0)>>>0>(c[m>>2]|0)>>>0;c[g>>2]=c[f>>2]|c[p>>2];b=c[o>>2]|0;a=c[q>>2]|0;c[q>>2]=a+4;c[a>>2]=b;a=(c[r>>2]|0)+ -1|0;c[r>>2]=a}while((a|0)!=0);i=n;return c[g>>2]|0}function ue(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;q=i;i=i+80|0;n=q+68|0;p=q+64|0;o=q+60|0;s=q+56|0;f=q+52|0;g=q+48|0;k=q+44|0;m=q+40|0;l=q+36|0;j=q+32|0;y=q+28|0;h=q+24|0;u=q+20|0;w=q+16|0;v=q+12|0;x=q+8|0;r=q+4|0;t=q;c[n>>2]=a;c[p>>2]=b;c[o>>2]=d;c[s>>2]=e;c[g>>2]=0;do{a=c[p>>2]|0;c[p>>2]=a+4;c[f>>2]=c[a>>2];c[r>>2]=c[f>>2];c[t>>2]=c[s>>2];c[u>>2]=c[r>>2]&65535;c[v>>2]=(c[r>>2]|0)>>>16;c[w>>2]=c[t>>2]&65535;c[x>>2]=(c[t>>2]|0)>>>16;c[l>>2]=ea(c[u>>2]|0,c[w>>2]|0)|0;c[j>>2]=ea(c[u>>2]|0,c[x>>2]|0)|0;c[y>>2]=ea(c[v>>2]|0,c[w>>2]|0)|0;c[h>>2]=ea(c[v>>2]|0,c[x>>2]|0)|0;c[j>>2]=(c[j>>2]|0)+((c[l>>2]|0)>>>16);c[j>>2]=(c[j>>2]|0)+(c[y>>2]|0);if((c[j>>2]|0)>>>0<(c[y>>2]|0)>>>0){c[h>>2]=(c[h>>2]|0)+65536}c[k>>2]=(c[h>>2]|0)+((c[j>>2]|0)>>>16);c[m>>2]=(c[j>>2]<<16)+(c[l>>2]&65535);c[m>>2]=(c[m>>2]|0)+(c[g>>2]|0);c[g>>2]=((c[m>>2]|0)>>>0<(c[g>>2]|0)>>>0)+(c[k>>2]|0);b=c[m>>2]|0;a=c[n>>2]|0;c[n>>2]=a+4;c[a>>2]=b;a=(c[o>>2]|0)+ -1|0;c[o>>2]=a}while((a|0)!=0);i=q;return c[g>>2]|0}function ve(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;r=i;i=i+80|0;n=r+72|0;q=r+68|0;p=r+64|0;t=r+60|0;f=r+56|0;g=r+52|0;k=r+48|0;m=r+44|0;o=r+40|0;l=r+36|0;j=r+32|0;z=r+28|0;h=r+24|0;v=r+20|0;x=r+16|0;w=r+12|0;y=r+8|0;s=r+4|0;u=r;c[n>>2]=a;c[q>>2]=b;c[p>>2]=d;c[t>>2]=e;c[g>>2]=0;do{a=c[q>>2]|0;c[q>>2]=a+4;c[f>>2]=c[a>>2];c[s>>2]=c[f>>2];c[u>>2]=c[t>>2];c[v>>2]=c[s>>2]&65535;c[w>>2]=(c[s>>2]|0)>>>16;c[x>>2]=c[u>>2]&65535;c[y>>2]=(c[u>>2]|0)>>>16;c[l>>2]=ea(c[v>>2]|0,c[x>>2]|0)|0;c[j>>2]=ea(c[v>>2]|0,c[y>>2]|0)|0;c[z>>2]=ea(c[w>>2]|0,c[x>>2]|0)|0;c[h>>2]=ea(c[w>>2]|0,c[y>>2]|0)|0;c[j>>2]=(c[j>>2]|0)+((c[l>>2]|0)>>>16);c[j>>2]=(c[j>>2]|0)+(c[z>>2]|0);if((c[j>>2]|0)>>>0<(c[z>>2]|0)>>>0){c[h>>2]=(c[h>>2]|0)+65536}c[k>>2]=(c[h>>2]|0)+((c[j>>2]|0)>>>16);c[m>>2]=(c[j>>2]<<16)+(c[l>>2]&65535);c[m>>2]=(c[m>>2]|0)+(c[g>>2]|0);c[g>>2]=((c[m>>2]|0)>>>0<(c[g>>2]|0)>>>0)+(c[k>>2]|0);c[o>>2]=c[c[n>>2]>>2];c[m>>2]=(c[o>>2]|0)+(c[m>>2]|0);c[g>>2]=(c[g>>2]|0)+((c[m>>2]|0)>>>0<(c[o>>2]|0)>>>0);b=c[m>>2]|0;a=c[n>>2]|0;c[n>>2]=a+4;c[a>>2]=b;a=(c[p>>2]|0)+ -1|0;c[p>>2]=a}while((a|0)!=0);i=r;return c[g>>2]|0}function we(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;r=i;i=i+80|0;n=r+72|0;q=r+68|0;p=r+64|0;t=r+60|0;f=r+56|0;g=r+52|0;k=r+48|0;m=r+44|0;o=r+40|0;l=r+36|0;j=r+32|0;z=r+28|0;h=r+24|0;v=r+20|0;x=r+16|0;w=r+12|0;y=r+8|0;s=r+4|0;u=r;c[n>>2]=a;c[q>>2]=b;c[p>>2]=d;c[t>>2]=e;c[g>>2]=0;do{a=c[q>>2]|0;c[q>>2]=a+4;c[f>>2]=c[a>>2];c[s>>2]=c[f>>2];c[u>>2]=c[t>>2];c[v>>2]=c[s>>2]&65535;c[w>>2]=(c[s>>2]|0)>>>16;c[x>>2]=c[u>>2]&65535;c[y>>2]=(c[u>>2]|0)>>>16;c[l>>2]=ea(c[v>>2]|0,c[x>>2]|0)|0;c[j>>2]=ea(c[v>>2]|0,c[y>>2]|0)|0;c[z>>2]=ea(c[w>>2]|0,c[x>>2]|0)|0;c[h>>2]=ea(c[w>>2]|0,c[y>>2]|0)|0;c[j>>2]=(c[j>>2]|0)+((c[l>>2]|0)>>>16);c[j>>2]=(c[j>>2]|0)+(c[z>>2]|0);if((c[j>>2]|0)>>>0<(c[z>>2]|0)>>>0){c[h>>2]=(c[h>>2]|0)+65536}c[k>>2]=(c[h>>2]|0)+((c[j>>2]|0)>>>16);c[m>>2]=(c[j>>2]<<16)+(c[l>>2]&65535);c[m>>2]=(c[m>>2]|0)+(c[g>>2]|0);c[g>>2]=((c[m>>2]|0)>>>0<(c[g>>2]|0)>>>0)+(c[k>>2]|0);c[o>>2]=c[c[n>>2]>>2];c[m>>2]=(c[o>>2]|0)-(c[m>>2]|0);c[g>>2]=(c[g>>2]|0)+((c[m>>2]|0)>>>0>(c[o>>2]|0)>>>0);b=c[m>>2]|0;a=c[n>>2]|0;c[n>>2]=a+4;c[a>>2]=b;a=(c[p>>2]|0)+ -1|0;c[p>>2]=a}while((a|0)!=0);i=r;return c[g>>2]|0}function xe(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=i;i=i+48|0;g=h+32|0;f=h+28|0;p=h+24|0;o=h+20|0;l=h+16|0;m=h+12|0;n=h+8|0;k=h+4|0;j=h;c[g>>2]=a;c[f>>2]=b;c[p>>2]=d;c[o>>2]=e;c[f>>2]=(c[f>>2]|0)+(c[p>>2]<<2);c[g>>2]=(c[g>>2]|0)+(c[p>>2]<<2);c[n>>2]=32-(c[o>>2]|0);a=(c[f>>2]|0)+ -4|0;c[f>>2]=a;c[m>>2]=c[a>>2];c[j>>2]=(c[m>>2]|0)>>>(c[n>>2]|0);c[l>>2]=c[m>>2]<<c[o>>2];c[k>>2]=(c[p>>2]|0)-1;while(1){if((c[k>>2]|0)==0){break}a=(c[f>>2]|0)+ -4|0;c[f>>2]=a;c[m>>2]=c[a>>2];a=c[l>>2]|(c[m>>2]|0)>>>(c[n>>2]|0);p=(c[g>>2]|0)+ -4|0;c[g>>2]=p;c[p>>2]=a;c[l>>2]=c[m>>2]<<c[o>>2];c[k>>2]=(c[k>>2]|0)+ -1}a=c[l>>2]|0;p=(c[g>>2]|0)+ -4|0;c[g>>2]=p;c[p>>2]=a;i=h;return c[j>>2]|0}function ye(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=i;i=i+48|0;g=h+32|0;f=h+28|0;p=h+24|0;o=h+20|0;m=h+16|0;l=h+12|0;n=h+8|0;k=h+4|0;j=h;c[g>>2]=a;c[f>>2]=b;c[p>>2]=d;c[o>>2]=e;c[n>>2]=32-(c[o>>2]|0);a=c[f>>2]|0;c[f>>2]=a+4;c[m>>2]=c[a>>2];c[j>>2]=c[m>>2]<<c[n>>2];c[l>>2]=(c[m>>2]|0)>>>(c[o>>2]|0);c[k>>2]=(c[p>>2]|0)-1;while(1){if((c[k>>2]|0)==0){break}a=c[f>>2]|0;c[f>>2]=a+4;c[m>>2]=c[a>>2];a=c[l>>2]|c[m>>2]<<c[n>>2];p=c[g>>2]|0;c[g>>2]=p+4;c[p>>2]=a;c[l>>2]=(c[m>>2]|0)>>>(c[o>>2]|0);c[k>>2]=(c[k>>2]|0)+ -1}c[c[g>>2]>>2]=c[l>>2];i=h;return c[j>>2]|0}function ze(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;E=i;i=i+176|0;F=E+172|0;z=E+168|0;v=E+164|0;k=E+160|0;u=E+156|0;y=E+152|0;w=E+148|0;h=E+144|0;I=E+140|0;A=E+136|0;G=E+132|0;g=E+128|0;x=E+124|0;H=E+120|0;Y=E+116|0;Z=E+112|0;W=E+108|0;X=E+104|0;J=E+100|0;K=E+96|0;L=E+92|0;S=E+88|0;T=E+84|0;U=E+80|0;V=E+76|0;O=E+72|0;Q=E+68|0;P=E+64|0;R=E+60|0;M=E+56|0;N=E+52|0;q=E+48|0;r=E+44|0;s=E+40|0;t=E+36|0;m=E+32|0;o=E+28|0;n=E+24|0;p=E+20|0;j=E+16|0;l=E+12|0;B=E+8|0;C=E+4|0;D=E;c[F>>2]=a;c[z>>2]=b;c[v>>2]=e;c[k>>2]=f;if((c[k>>2]&1|0)==0){c[Y>>2]=c[k>>2];if((((c[Y>>2]&255|0)!=0|0)!=0|0)!=0){c[H>>2]=(d[7496+(c[Y>>2]&0-(c[Y>>2]|0))|0]|0)-2}else{c[Z>>2]=6;while(1){if((c[Z>>2]|0)>=30){break}c[Y>>2]=(c[Y>>2]|0)>>>8;if((((c[Y>>2]&255|0)!=0|0)!=0|0)!=0){break}c[Z>>2]=(c[Z>>2]|0)+8}c[H>>2]=(c[Z>>2]|0)+(d[7496+(c[Y>>2]&0-(c[Y>>2]|0))|0]|0)}c[k>>2]=(c[k>>2]|0)>>>(c[H>>2]|0)}else{c[H>>2]=0}c[W>>2]=c[k>>2];c[X>>2]=d[8096+((((c[W>>2]|0)>>>0)/2|0)&127)|0]|0;a=ea(c[X>>2]|0,c[X>>2]|0)|0;c[X>>2]=(c[X>>2]<<1)-(ea(a,c[W>>2]|0)|0);a=ea(c[X>>2]|0,c[X>>2]|0)|0;c[X>>2]=(c[X>>2]<<1)-(ea(a,c[W>>2]|0)|0);c[g>>2]=c[X>>2];c[k>>2]=c[k>>2]<<0;if((c[H>>2]|0)==0){c[A>>2]=c[c[z>>2]>>2];c[h>>2]=ea(c[A>>2]|0,c[g>>2]|0)|0;c[c[F>>2]>>2]=c[h>>2];c[y>>2]=0;c[u>>2]=1;while(1){if((c[u>>2]|0)>=(c[v>>2]|0)){break}c[j>>2]=c[h>>2];c[l>>2]=c[k>>2];c[m>>2]=c[j>>2]&65535;c[n>>2]=(c[j>>2]|0)>>>16;c[o>>2]=c[l>>2]&65535;c[p>>2]=(c[l>>2]|0)>>>16;c[q>>2]=ea(c[m>>2]|0,c[o>>2]|0)|0;c[r>>2]=ea(c[m>>2]|0,c[p>>2]|0)|0;c[s>>2]=ea(c[n>>2]|0,c[o>>2]|0)|0;c[t>>2]=ea(c[n>>2]|0,c[p>>2]|0)|0;c[r>>2]=(c[r>>2]|0)+((c[q>>2]|0)>>>16);c[r>>2]=(c[r>>2]|0)+(c[s>>2]|0);if((c[r>>2]|0)>>>0<(c[s>>2]|0)>>>0){c[t>>2]=(c[t>>2]|0)+65536}c[w>>2]=(c[t>>2]|0)+((c[r>>2]|0)>>>16);c[x>>2]=(c[r>>2]<<16)+(c[q>>2]&65535);c[y>>2]=(c[y>>2]|0)+(c[w>>2]|0);c[A>>2]=c[(c[z>>2]|0)+(c[u>>2]<<2)>>2];c[B>>2]=c[A>>2];c[C>>2]=c[y>>2];c[D>>2]=(c[B>>2]|0)-(c[C>>2]|0);c[h>>2]=c[D>>2];c[y>>2]=(c[D>>2]|0)>>>0>(c[B>>2]|0)>>>0;c[h>>2]=ea(c[h>>2]|0,c[g>>2]|0)|0;c[(c[F>>2]|0)+(c[u>>2]<<2)>>2]=c[h>>2];c[u>>2]=(c[u>>2]|0)+1}i=E;return}c[y>>2]=0;c[A>>2]=c[c[z>>2]>>2];c[u>>2]=1;while(1){if((c[u>>2]|0)>=(c[v>>2]|0)){break}c[G>>2]=c[(c[z>>2]|0)+(c[u>>2]<<2)>>2];c[I>>2]=(c[A>>2]|0)>>>(c[H>>2]|0)|c[G>>2]<<32-(c[H>>2]|0);c[A>>2]=c[G>>2];c[J>>2]=c[I>>2];c[K>>2]=c[y>>2];c[L>>2]=(c[J>>2]|0)-(c[K>>2]|0);c[h>>2]=c[L>>2];c[y>>2]=(c[L>>2]|0)>>>0>(c[J>>2]|0)>>>0;c[h>>2]=ea(c[h>>2]|0,c[g>>2]|0)|0;c[(c[F>>2]|0)+((c[u>>2]|0)-1<<2)>>2]=c[h>>2];c[M>>2]=c[h>>2];c[N>>2]=c[k>>2];c[O>>2]=c[M>>2]&65535;c[P>>2]=(c[M>>2]|0)>>>16;c[Q>>2]=c[N>>2]&65535;c[R>>2]=(c[N>>2]|0)>>>16;c[S>>2]=ea(c[O>>2]|0,c[Q>>2]|0)|0;c[T>>2]=ea(c[O>>2]|0,c[R>>2]|0)|0;c[U>>2]=ea(c[P>>2]|0,c[Q>>2]|0)|0;c[V>>2]=ea(c[P>>2]|0,c[R>>2]|0)|0;c[T>>2]=(c[T>>2]|0)+((c[S>>2]|0)>>>16);c[T>>2]=(c[T>>2]|0)+(c[U>>2]|0);if((c[T>>2]|0)>>>0<(c[U>>2]|0)>>>0){c[V>>2]=(c[V>>2]|0)+65536}c[w>>2]=(c[V>>2]|0)+((c[T>>2]|0)>>>16);c[x>>2]=(c[T>>2]<<16)+(c[S>>2]&65535);c[y>>2]=(c[y>>2]|0)+(c[w>>2]|0);c[u>>2]=(c[u>>2]|0)+1}do{}while((c[u>>2]|0)<(c[v>>2]|0));c[I>>2]=(c[A>>2]|0)>>>(c[H>>2]|0);c[h>>2]=(c[I>>2]|0)-(c[y>>2]|0);c[h>>2]=ea(c[h>>2]|0,c[g>>2]|0)|0;c[(c[F>>2]|0)+((c[v>>2]|0)-1<<2)>>2]=c[h>>2];i=E;return}function Ae(a,b,e,f,g){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0;n=i;i=i+432|0;m=n+424|0;l=n+420|0;qa=n+416|0;N=n+412|0;_=n+408|0;k=n+404|0;Va=n+400|0;j=n+396|0;la=n+392|0;J=n+388|0;h=n+384|0;Qa=n+380|0;Ka=n+376|0;Za=n+372|0;Xa=n+368|0;Wa=n+364|0;$a=n+360|0;_a=n+356|0;Ya=n+352|0;bb=n+348|0;ab=n+344|0;Sa=n+340|0;ib=n+336|0;Oa=n+332|0;Na=n+328|0;Ra=n+324|0;Ta=n+320|0;cb=n+316|0;Ua=n+312|0;gb=n+308|0;eb=n+304|0;fb=n+300|0;db=n+296|0;Ma=n+292|0;hb=n+288|0;Pa=n+284|0;Aa=n+280|0;za=n+276|0;ya=n+272|0;Ea=n+268|0;La=n+264|0;Da=n+260|0;Ca=n+256|0;Ba=n+252|0;Ia=n+248|0;Ga=n+244|0;Ha=n+240|0;Fa=n+236|0;xa=n+232|0;Ja=n+228|0;B=n+224|0;ja=n+220|0;ma=n+216|0;D=n+212|0;Y=n+208|0;H=n+204|0;F=n+200|0;E=n+196|0;K=n+192|0;I=n+188|0;G=n+184|0;M=n+180|0;L=n+176|0;aa=n+172|0;Z=n+168|0;W=n+164|0;V=n+160|0;$=n+156|0;ba=n+152|0;O=n+148|0;ca=n+144|0;S=n+140|0;Q=n+136|0;R=n+132|0;P=n+128|0;U=n+124|0;T=n+120|0;X=n+116|0;ga=n+112|0;ka=n+108|0;fa=n+104|0;oa=n+100|0;wa=n+96|0;ia=n+92|0;da=n+88|0;ha=n+84|0;sa=n+80|0;ua=n+76|0;ta=n+72|0;va=n+68|0;pa=n+64|0;ra=n+60|0;na=n+56|0;y=n+52|0;v=n+48|0;t=n+44|0;u=n+40|0;p=n+36|0;C=n+32|0;A=n+28|0;z=n+24|0;o=n+20|0;r=n+16|0;s=n+12|0;q=n+8|0;x=n+4|0;w=n;c[l>>2]=a;c[qa>>2]=b;c[N>>2]=e;c[_>>2]=f;c[k>>2]=g;c[h>>2]=0;c[Va>>2]=(c[_>>2]|0)+(c[qa>>2]|0);if((c[Va>>2]|0)==0){c[m>>2]=0;a=c[m>>2]|0;i=n;return a|0}c[k>>2]=c[k>>2]<<0;c[l>>2]=(c[l>>2]|0)+((c[Va>>2]|0)-1<<2);g=(c[_>>2]|0)!=0;if((c[k>>2]&-2147483648|0)!=0){if(g){c[h>>2]=c[(c[N>>2]|0)+((c[_>>2]|0)-1<<2)>>2]<<0;c[Qa>>2]=(c[h>>2]|0)>>>0>=(c[k>>2]|0)>>>0;b=c[Qa>>2]|0;a=c[l>>2]|0;c[l>>2]=a+ -4;c[a>>2]=b;c[h>>2]=(c[h>>2]|0)-(c[k>>2]&0-(c[Qa>>2]|0));c[h>>2]=(c[h>>2]|0)>>>0;c[Va>>2]=(c[Va>>2]|0)+ -1;c[_>>2]=(c[_>>2]|0)+ -1}c[Xa>>2]=(c[k>>2]|0)>>>16;c[Wa>>2]=c[k>>2]&65535;c[$a>>2]=(~c[k>>2]>>>0)/((c[Xa>>2]|0)>>>0)|0;c[Ya>>2]=~c[k>>2]-(ea(c[$a>>2]|0,c[Xa>>2]|0)|0);c[ab>>2]=ea(c[$a>>2]|0,c[Wa>>2]|0)|0;c[Ya>>2]=c[Ya>>2]<<16|65535;if(((c[Ya>>2]|0)>>>0<(c[ab>>2]|0)>>>0?(c[$a>>2]=(c[$a>>2]|0)+ -1,c[Ya>>2]=(c[Ya>>2]|0)+(c[k>>2]|0),(c[Ya>>2]|0)>>>0>=(c[k>>2]|0)>>>0):0)?(c[Ya>>2]|0)>>>0<(c[ab>>2]|0)>>>0:0){c[$a>>2]=(c[$a>>2]|0)+ -1;c[Ya>>2]=(c[Ya>>2]|0)+(c[k>>2]|0)}c[Ya>>2]=(c[Ya>>2]|0)-(c[ab>>2]|0);c[_a>>2]=((c[Ya>>2]|0)>>>0)/((c[Xa>>2]|0)>>>0)|0;c[bb>>2]=(c[Ya>>2]|0)-(ea(c[_a>>2]|0,c[Xa>>2]|0)|0);c[ab>>2]=ea(c[_a>>2]|0,c[Wa>>2]|0)|0;c[bb>>2]=c[bb>>2]<<16|65535;if(((c[bb>>2]|0)>>>0<(c[ab>>2]|0)>>>0?(c[_a>>2]=(c[_a>>2]|0)+ -1,c[bb>>2]=(c[bb>>2]|0)+(c[k>>2]|0),(c[bb>>2]|0)>>>0>=(c[k>>2]|0)>>>0):0)?(c[bb>>2]|0)>>>0<(c[ab>>2]|0)>>>0:0){c[_a>>2]=(c[_a>>2]|0)+ -1;c[bb>>2]=(c[bb>>2]|0)+(c[k>>2]|0)}c[bb>>2]=(c[bb>>2]|0)-(c[ab>>2]|0);c[Ka>>2]=c[$a>>2]<<16|c[_a>>2];c[Za>>2]=c[bb>>2];c[j>>2]=(c[_>>2]|0)-1;while(1){if((c[j>>2]|0)<0){break}c[J>>2]=c[(c[N>>2]|0)+(c[j>>2]<<2)>>2]<<0;c[Ma>>2]=c[h>>2];c[hb>>2]=c[Ka>>2];c[gb>>2]=c[Ma>>2]&65535;c[fb>>2]=(c[Ma>>2]|0)>>>16;c[eb>>2]=c[hb>>2]&65535;c[db>>2]=(c[hb>>2]|0)>>>16;c[Ra>>2]=ea(c[gb>>2]|0,c[eb>>2]|0)|0;c[Ta>>2]=ea(c[gb>>2]|0,c[db>>2]|0)|0;c[cb>>2]=ea(c[fb>>2]|0,c[eb>>2]|0)|0;c[Ua>>2]=ea(c[fb>>2]|0,c[db>>2]|0)|0;c[Ta>>2]=(c[Ta>>2]|0)+((c[Ra>>2]|0)>>>16);c[Ta>>2]=(c[Ta>>2]|0)+(c[cb>>2]|0);if((c[Ta>>2]|0)>>>0<(c[cb>>2]|0)>>>0){c[Ua>>2]=(c[Ua>>2]|0)+65536}c[Sa>>2]=(c[Ua>>2]|0)+((c[Ta>>2]|0)>>>16);c[ib>>2]=(c[Ta>>2]<<16)+(c[Ra>>2]&65535);c[Pa>>2]=(c[ib>>2]|0)+(c[J>>2]|0);c[Sa>>2]=(c[Sa>>2]|0)+((c[h>>2]|0)+1)+((c[Pa>>2]|0)>>>0<(c[ib>>2]|0)>>>0);c[ib>>2]=c[Pa>>2];c[Oa>>2]=(c[J>>2]|0)-(ea(c[Sa>>2]|0,c[k>>2]|0)|0);c[Na>>2]=0-((c[Oa>>2]|0)>>>0>(c[ib>>2]|0)>>>0);c[Sa>>2]=(c[Sa>>2]|0)+(c[Na>>2]|0);c[Oa>>2]=(c[Oa>>2]|0)+(c[Na>>2]&c[k>>2]);if((((c[Oa>>2]|0)>>>0>=(c[k>>2]|0)>>>0|0)!=0|0)!=0){c[Oa>>2]=(c[Oa>>2]|0)-(c[k>>2]|0);c[Sa>>2]=(c[Sa>>2]|0)+1}c[h>>2]=c[Oa>>2];c[c[l>>2]>>2]=c[Sa>>2];c[h>>2]=(c[h>>2]|0)>>>0;c[l>>2]=(c[l>>2]|0)+ -4;c[j>>2]=(c[j>>2]|0)+ -1}c[j>>2]=(c[qa>>2]|0)-1;while(1){o=c[h>>2]|0;if((c[j>>2]|0)<0){break}c[xa>>2]=o;c[Ja>>2]=c[Ka>>2];c[Ia>>2]=c[xa>>2]&65535;c[Ha>>2]=(c[xa>>2]|0)>>>16;c[Ga>>2]=c[Ja>>2]&65535;c[Fa>>2]=(c[Ja>>2]|0)>>>16;c[La>>2]=ea(c[Ia>>2]|0,c[Ga>>2]|0)|0;c[Da>>2]=ea(c[Ia>>2]|0,c[Fa>>2]|0)|0;c[Ca>>2]=ea(c[Ha>>2]|0,c[Ga>>2]|0)|0;c[Ba>>2]=ea(c[Ha>>2]|0,c[Fa>>2]|0)|0;c[Da>>2]=(c[Da>>2]|0)+((c[La>>2]|0)>>>16);c[Da>>2]=(c[Da>>2]|0)+(c[Ca>>2]|0);if((c[Da>>2]|0)>>>0<(c[Ca>>2]|0)>>>0){c[Ba>>2]=(c[Ba>>2]|0)+65536}c[Aa>>2]=(c[Ba>>2]|0)+((c[Da>>2]|0)>>>16);c[za>>2]=(c[Da>>2]<<16)+(c[La>>2]&65535);c[Aa>>2]=(c[Aa>>2]|0)+((c[h>>2]|0)+1);c[ya>>2]=ea(0-(c[Aa>>2]|0)|0,c[k>>2]|0)|0;c[Ea>>2]=0-((c[ya>>2]|0)>>>0>(c[za>>2]|0)>>>0);c[Aa>>2]=(c[Aa>>2]|0)+(c[Ea>>2]|0);c[ya>>2]=(c[ya>>2]|0)+(c[Ea>>2]&c[k>>2]);c[h>>2]=c[ya>>2];c[c[l>>2]>>2]=c[Aa>>2];c[h>>2]=(c[h>>2]|0)>>>0;c[l>>2]=(c[l>>2]|0)+ -4;c[j>>2]=(c[j>>2]|0)+ -1}c[m>>2]=o;a=c[m>>2]|0;i=n;return a|0}do{if(g?(c[la>>2]=c[(c[N>>2]|0)+((c[_>>2]|0)-1<<2)>>2]<<0,(c[la>>2]|0)>>>0<(c[k>>2]|0)>>>0):0){c[h>>2]=(c[la>>2]|0)>>>0;a=c[l>>2]|0;c[l>>2]=a+ -4;c[a>>2]=0;c[Va>>2]=(c[Va>>2]|0)+ -1;if((c[Va>>2]|0)!=0){c[_>>2]=(c[_>>2]|0)+ -1;break}c[m>>2]=c[h>>2];a=c[m>>2]|0;i=n;return a|0}}while(0);c[ja>>2]=c[k>>2];xa=c[ja>>2]|0;if((c[ja>>2]|0)>>>0<65536){xa=xa>>>0<256?1:9}else{xa=xa>>>0<16777216?17:25}c[ma>>2]=xa;c[B>>2]=33-(c[ma>>2]|0)-(d[7496+((c[ja>>2]|0)>>>(c[ma>>2]|0))|0]|0);c[k>>2]=c[k>>2]<<c[B>>2];c[h>>2]=c[h>>2]<<c[B>>2];c[F>>2]=(c[k>>2]|0)>>>16;c[E>>2]=c[k>>2]&65535;c[K>>2]=(~c[k>>2]>>>0)/((c[F>>2]|0)>>>0)|0;c[G>>2]=~c[k>>2]-(ea(c[K>>2]|0,c[F>>2]|0)|0);c[L>>2]=ea(c[K>>2]|0,c[E>>2]|0)|0;c[G>>2]=c[G>>2]<<16|65535;if(((c[G>>2]|0)>>>0<(c[L>>2]|0)>>>0?(c[K>>2]=(c[K>>2]|0)+ -1,c[G>>2]=(c[G>>2]|0)+(c[k>>2]|0),(c[G>>2]|0)>>>0>=(c[k>>2]|0)>>>0):0)?(c[G>>2]|0)>>>0<(c[L>>2]|0)>>>0:0){c[K>>2]=(c[K>>2]|0)+ -1;c[G>>2]=(c[G>>2]|0)+(c[k>>2]|0)}c[G>>2]=(c[G>>2]|0)-(c[L>>2]|0);c[I>>2]=((c[G>>2]|0)>>>0)/((c[F>>2]|0)>>>0)|0;c[M>>2]=(c[G>>2]|0)-(ea(c[I>>2]|0,c[F>>2]|0)|0);c[L>>2]=ea(c[I>>2]|0,c[E>>2]|0)|0;c[M>>2]=c[M>>2]<<16|65535;if(((c[M>>2]|0)>>>0<(c[L>>2]|0)>>>0?(c[I>>2]=(c[I>>2]|0)+ -1,c[M>>2]=(c[M>>2]|0)+(c[k>>2]|0),(c[M>>2]|0)>>>0>=(c[k>>2]|0)>>>0):0)?(c[M>>2]|0)>>>0<(c[L>>2]|0)>>>0:0){c[I>>2]=(c[I>>2]|0)+ -1;c[M>>2]=(c[M>>2]|0)+(c[k>>2]|0)}c[M>>2]=(c[M>>2]|0)-(c[L>>2]|0);c[D>>2]=c[K>>2]<<16|c[I>>2];c[H>>2]=c[M>>2];if((c[_>>2]|0)!=0){c[la>>2]=c[(c[N>>2]|0)+((c[_>>2]|0)-1<<2)>>2]<<0;c[h>>2]=c[h>>2]|(c[la>>2]|0)>>>(32-(c[B>>2]|0)|0);c[j>>2]=(c[_>>2]|0)-2;while(1){if((c[j>>2]|0)<0){break}c[J>>2]=c[(c[N>>2]|0)+(c[j>>2]<<2)>>2]<<0;c[Y>>2]=c[la>>2]<<c[B>>2]|(c[J>>2]|0)>>>(32-(c[B>>2]|0)|0);c[U>>2]=c[h>>2];c[T>>2]=c[D>>2];c[S>>2]=c[U>>2]&65535;c[R>>2]=(c[U>>2]|0)>>>16;c[Q>>2]=c[T>>2]&65535;c[P>>2]=(c[T>>2]|0)>>>16;c[$>>2]=ea(c[S>>2]|0,c[Q>>2]|0)|0;c[ba>>2]=ea(c[S>>2]|0,c[P>>2]|0)|0;c[O>>2]=ea(c[R>>2]|0,c[Q>>2]|0)|0;c[ca>>2]=ea(c[R>>2]|0,c[P>>2]|0)|0;c[ba>>2]=(c[ba>>2]|0)+((c[$>>2]|0)>>>16);c[ba>>2]=(c[ba>>2]|0)+(c[O>>2]|0);if((c[ba>>2]|0)>>>0<(c[O>>2]|0)>>>0){c[ca>>2]=(c[ca>>2]|0)+65536}c[aa>>2]=(c[ca>>2]|0)+((c[ba>>2]|0)>>>16);c[Z>>2]=(c[ba>>2]<<16)+(c[$>>2]&65535);c[X>>2]=(c[Z>>2]|0)+(c[Y>>2]|0);c[aa>>2]=(c[aa>>2]|0)+((c[h>>2]|0)+1)+((c[X>>2]|0)>>>0<(c[Z>>2]|0)>>>0);c[Z>>2]=c[X>>2];c[W>>2]=(c[Y>>2]|0)-(ea(c[aa>>2]|0,c[k>>2]|0)|0);c[V>>2]=0-((c[W>>2]|0)>>>0>(c[Z>>2]|0)>>>0);c[aa>>2]=(c[aa>>2]|0)+(c[V>>2]|0);c[W>>2]=(c[W>>2]|0)+(c[V>>2]&c[k>>2]);if((((c[W>>2]|0)>>>0>=(c[k>>2]|0)>>>0|0)!=0|0)!=0){c[W>>2]=(c[W>>2]|0)-(c[k>>2]|0);c[aa>>2]=(c[aa>>2]|0)+1}c[h>>2]=c[W>>2];c[c[l>>2]>>2]=c[aa>>2];c[h>>2]=(c[h>>2]|0)>>>0;c[l>>2]=(c[l>>2]|0)+ -4;c[la>>2]=c[J>>2];c[j>>2]=(c[j>>2]|0)+ -1}c[pa>>2]=c[h>>2];c[ra>>2]=c[D>>2];c[sa>>2]=c[pa>>2]&65535;c[ta>>2]=(c[pa>>2]|0)>>>16;c[ua>>2]=c[ra>>2]&65535;c[va>>2]=(c[ra>>2]|0)>>>16;c[wa>>2]=ea(c[sa>>2]|0,c[ua>>2]|0)|0;c[ia>>2]=ea(c[sa>>2]|0,c[va>>2]|0)|0;c[da>>2]=ea(c[ta>>2]|0,c[ua>>2]|0)|0;c[ha>>2]=ea(c[ta>>2]|0,c[va>>2]|0)|0;c[ia>>2]=(c[ia>>2]|0)+((c[wa>>2]|0)>>>16);c[ia>>2]=(c[ia>>2]|0)+(c[da>>2]|0);if((c[ia>>2]|0)>>>0<(c[da>>2]|0)>>>0){c[ha>>2]=(c[ha>>2]|0)+65536}c[ga>>2]=(c[ha>>2]|0)+((c[ia>>2]|0)>>>16);c[ka>>2]=(c[ia>>2]<<16)+(c[wa>>2]&65535);c[na>>2]=(c[ka>>2]|0)+(c[la>>2]<<c[B>>2]);c[ga>>2]=(c[ga>>2]|0)+((c[h>>2]|0)+1)+((c[na>>2]|0)>>>0<(c[ka>>2]|0)>>>0);c[ka>>2]=c[na>>2];c[fa>>2]=(c[la>>2]<<c[B>>2])-(ea(c[ga>>2]|0,c[k>>2]|0)|0);c[oa>>2]=0-((c[fa>>2]|0)>>>0>(c[ka>>2]|0)>>>0);c[ga>>2]=(c[ga>>2]|0)+(c[oa>>2]|0);c[fa>>2]=(c[fa>>2]|0)+(c[oa>>2]&c[k>>2]);if((((c[fa>>2]|0)>>>0>=(c[k>>2]|0)>>>0|0)!=0|0)!=0){c[fa>>2]=(c[fa>>2]|0)-(c[k>>2]|0);c[ga>>2]=(c[ga>>2]|0)+1}c[h>>2]=c[fa>>2];c[c[l>>2]>>2]=c[ga>>2];c[h>>2]=(c[h>>2]|0)>>>0;c[l>>2]=(c[l>>2]|0)+ -4}c[j>>2]=(c[qa>>2]|0)-1;while(1){E=c[h>>2]|0;if((c[j>>2]|0)<0){break}c[x>>2]=E;c[w>>2]=c[D>>2];c[o>>2]=c[x>>2]&65535;c[s>>2]=(c[x>>2]|0)>>>16;c[r>>2]=c[w>>2]&65535;c[q>>2]=(c[w>>2]|0)>>>16;c[p>>2]=ea(c[o>>2]|0,c[r>>2]|0)|0;c[C>>2]=ea(c[o>>2]|0,c[q>>2]|0)|0;c[A>>2]=ea(c[s>>2]|0,c[r>>2]|0)|0;c[z>>2]=ea(c[s>>2]|0,c[q>>2]|0)|0;c[C>>2]=(c[C>>2]|0)+((c[p>>2]|0)>>>16);c[C>>2]=(c[C>>2]|0)+(c[A>>2]|0);if((c[C>>2]|0)>>>0<(c[A>>2]|0)>>>0){c[z>>2]=(c[z>>2]|0)+65536}c[y>>2]=(c[z>>2]|0)+((c[C>>2]|0)>>>16);c[v>>2]=(c[C>>2]<<16)+(c[p>>2]&65535);c[y>>2]=(c[y>>2]|0)+((c[h>>2]|0)+1);c[t>>2]=ea(0-(c[y>>2]|0)|0,c[k>>2]|0)|0;c[u>>2]=0-((c[t>>2]|0)>>>0>(c[v>>2]|0)>>>0);c[y>>2]=(c[y>>2]|0)+(c[u>>2]|0);c[t>>2]=(c[t>>2]|0)+(c[u>>2]&c[k>>2]);c[h>>2]=c[t>>2];c[c[l>>2]>>2]=c[y>>2];c[h>>2]=(c[h>>2]|0)>>>0;c[l>>2]=(c[l>>2]|0)+ -4;c[j>>2]=(c[j>>2]|0)+ -1}c[m>>2]=E>>>(c[B>>2]|0);a=c[m>>2]|0;i=n;return a|0}function Be(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0;l=i;i=i+400|0;T=l+384|0;U=l+380|0;h=l+376|0;Aa=l+372|0;Za=l+368|0;k=l+364|0;S=l+360|0;da=l+356|0;j=l+352|0;x=l+348|0;v=l+344|0;L=l+340|0;Ya=l+336|0;za=l+332|0;Ca=l+328|0;Ga=l+324|0;Ba=l+320|0;Pa=l+316|0;Ua=l+312|0;Wa=l+308|0;Xa=l+304|0;Sa=l+300|0;Ta=l+296|0;Va=l+292|0;Qa=l+288|0;Ra=l+284|0;Ha=l+280|0;Fa=l+276|0;Oa=l+272|0;Ea=l+268|0;Ka=l+264|0;Ma=l+260|0;La=l+256|0;Na=l+252|0;Ia=l+248|0;Ja=l+244|0;ia=l+240|0;$=l+236|0;aa=l+232|0;X=l+228|0;Z=l+224|0;ba=l+220|0;ga=l+216|0;fa=l+212|0;xa=l+208|0;g=l+204|0;ta=l+200|0;va=l+196|0;ua=l+192|0;wa=l+188|0;ra=l+184|0;sa=l+180|0;ha=l+176|0;ja=l+172|0;Y=l+168|0;W=l+164|0;qa=l+160|0;V=l+156|0;ma=l+152|0;oa=l+148|0;na=l+144|0;pa=l+140|0;ka=l+136|0;la=l+132|0;_=l+128|0;ca=l+124|0;ya=l+120|0;s=l+116|0;t=l+112|0;o=l+108|0;q=l+104|0;u=l+100|0;A=l+96|0;z=l+92|0;R=l+88|0;y=l+84|0;N=l+80|0;P=l+76|0;O=l+72|0;Q=l+68|0;K=l+64|0;M=l+60|0;B=l+56|0;C=l+52|0;p=l+48|0;n=l+44|0;J=l+40|0;m=l+36|0;F=l+32|0;H=l+28|0;G=l+24|0;I=l+20|0;D=l+16|0;E=l+12|0;r=l+8|0;w=l+4|0;Da=l;c[T>>2]=a;c[U>>2]=b;c[h>>2]=d;c[Aa>>2]=e;c[Za>>2]=f;c[h>>2]=(c[h>>2]|0)+((c[Aa>>2]|0)-2<<2);c[x>>2]=c[(c[Za>>2]|0)+4>>2];c[v>>2]=c[c[Za>>2]>>2];c[da>>2]=c[(c[h>>2]|0)+4>>2];c[j>>2]=c[c[h>>2]>>2];c[k>>2]=0;do{if((c[da>>2]|0)>>>0>=(c[x>>2]|0)>>>0){if(!((c[da>>2]|0)>>>0>(c[x>>2]|0)>>>0)?!((c[j>>2]|0)>>>0>=(c[v>>2]|0)>>>0):0){break}c[Ya>>2]=(c[j>>2]|0)-(c[v>>2]|0);c[da>>2]=(c[da>>2]|0)-(c[x>>2]|0)-((c[j>>2]|0)>>>0<(c[v>>2]|0)>>>0);c[j>>2]=c[Ya>>2];c[k>>2]=1}}while(0);c[Wa>>2]=(c[x>>2]|0)>>>16;c[Xa>>2]=c[x>>2]&65535;c[Sa>>2]=(~c[x>>2]>>>0)/((c[Wa>>2]|0)>>>0)|0;c[Va>>2]=~c[x>>2]-(ea(c[Sa>>2]|0,c[Wa>>2]|0)|0);c[Ra>>2]=ea(c[Sa>>2]|0,c[Xa>>2]|0)|0;c[Va>>2]=c[Va>>2]<<16|65535;if(((c[Va>>2]|0)>>>0<(c[Ra>>2]|0)>>>0?(c[Sa>>2]=(c[Sa>>2]|0)+ -1,c[Va>>2]=(c[Va>>2]|0)+(c[x>>2]|0),(c[Va>>2]|0)>>>0>=(c[x>>2]|0)>>>0):0)?(c[Va>>2]|0)>>>0<(c[Ra>>2]|0)>>>0:0){c[Sa>>2]=(c[Sa>>2]|0)+ -1;c[Va>>2]=(c[Va>>2]|0)+(c[x>>2]|0)}c[Va>>2]=(c[Va>>2]|0)-(c[Ra>>2]|0);c[Ta>>2]=((c[Va>>2]|0)>>>0)/((c[Wa>>2]|0)>>>0)|0;c[Qa>>2]=(c[Va>>2]|0)-(ea(c[Ta>>2]|0,c[Wa>>2]|0)|0);c[Ra>>2]=ea(c[Ta>>2]|0,c[Xa>>2]|0)|0;c[Qa>>2]=c[Qa>>2]<<16|65535;if(((c[Qa>>2]|0)>>>0<(c[Ra>>2]|0)>>>0?(c[Ta>>2]=(c[Ta>>2]|0)+ -1,c[Qa>>2]=(c[Qa>>2]|0)+(c[x>>2]|0),(c[Qa>>2]|0)>>>0>=(c[x>>2]|0)>>>0):0)?(c[Qa>>2]|0)>>>0<(c[Ra>>2]|0)>>>0:0){c[Ta>>2]=(c[Ta>>2]|0)+ -1;c[Qa>>2]=(c[Qa>>2]|0)+(c[x>>2]|0)}c[Qa>>2]=(c[Qa>>2]|0)-(c[Ra>>2]|0);c[za>>2]=c[Sa>>2]<<16|c[Ta>>2];c[Ua>>2]=c[Qa>>2];c[Ca>>2]=ea(c[x>>2]|0,c[za>>2]|0)|0;c[Ca>>2]=(c[Ca>>2]|0)+(c[v>>2]|0);if((c[Ca>>2]|0)>>>0<(c[v>>2]|0)>>>0){c[za>>2]=(c[za>>2]|0)+ -1;c[Pa>>2]=0-((c[Ca>>2]|0)>>>0>=(c[x>>2]|0)>>>0);c[Ca>>2]=(c[Ca>>2]|0)-(c[x>>2]|0);c[za>>2]=(c[za>>2]|0)+(c[Pa>>2]|0);c[Ca>>2]=(c[Ca>>2]|0)-(c[Pa>>2]&c[x>>2])}c[Ia>>2]=c[v>>2];c[Ja>>2]=c[za>>2];c[Ka>>2]=c[Ia>>2]&65535;c[La>>2]=(c[Ia>>2]|0)>>>16;c[Ma>>2]=c[Ja>>2]&65535;c[Na>>2]=(c[Ja>>2]|0)>>>16;c[Ha>>2]=ea(c[Ka>>2]|0,c[Ma>>2]|0)|0;c[Fa>>2]=ea(c[Ka>>2]|0,c[Na>>2]|0)|0;c[Oa>>2]=ea(c[La>>2]|0,c[Ma>>2]|0)|0;c[Ea>>2]=ea(c[La>>2]|0,c[Na>>2]|0)|0;c[Fa>>2]=(c[Fa>>2]|0)+((c[Ha>>2]|0)>>>16);c[Fa>>2]=(c[Fa>>2]|0)+(c[Oa>>2]|0);if((c[Fa>>2]|0)>>>0<(c[Oa>>2]|0)>>>0){c[Ea>>2]=(c[Ea>>2]|0)+65536}c[Ga>>2]=(c[Ea>>2]|0)+((c[Fa>>2]|0)>>>16);c[Ba>>2]=(c[Fa>>2]<<16)+(c[Ha>>2]&65535);c[Ca>>2]=(c[Ca>>2]|0)+(c[Ga>>2]|0);do{if((c[Ca>>2]|0)>>>0<(c[Ga>>2]|0)>>>0?(c[za>>2]=(c[za>>2]|0)+ -1,(((c[Ca>>2]|0)>>>0>=(c[x>>2]|0)>>>0|0)!=0|0)!=0):0){if(!((c[Ca>>2]|0)>>>0>(c[x>>2]|0)>>>0)?!((c[Ba>>2]|0)>>>0>=(c[v>>2]|0)>>>0):0){break}c[za>>2]=(c[za>>2]|0)+ -1}}while(0);c[L>>2]=c[za>>2];c[T>>2]=(c[T>>2]|0)+(c[U>>2]<<2);c[S>>2]=(c[Aa>>2]|0)-2-1;while(1){if((c[S>>2]|0)<0){break}c[ia>>2]=c[(c[h>>2]|0)+ -4>>2];c[ra>>2]=c[da>>2];c[sa>>2]=c[L>>2];c[ta>>2]=c[ra>>2]&65535;c[ua>>2]=(c[ra>>2]|0)>>>16;c[va>>2]=c[sa>>2]&65535;c[wa>>2]=(c[sa>>2]|0)>>>16;c[ga>>2]=ea(c[ta>>2]|0,c[va>>2]|0)|0;c[fa>>2]=ea(c[ta>>2]|0,c[wa>>2]|0)|0;c[xa>>2]=ea(c[ua>>2]|0,c[va>>2]|0)|0;c[g>>2]=ea(c[ua>>2]|0,c[wa>>2]|0)|0;c[fa>>2]=(c[fa>>2]|0)+((c[ga>>2]|0)>>>16);c[fa>>2]=(c[fa>>2]|0)+(c[xa>>2]|0);if((c[fa>>2]|0)>>>0<(c[xa>>2]|0)>>>0){c[g>>2]=(c[g>>2]|0)+65536}c[$>>2]=(c[g>>2]|0)+((c[fa>>2]|0)>>>16);c[aa>>2]=(c[fa>>2]<<16)+(c[ga>>2]&65535);c[ha>>2]=(c[aa>>2]|0)+(c[j>>2]|0);c[$>>2]=(c[$>>2]|0)+(c[da>>2]|0)+((c[ha>>2]|0)>>>0<(c[aa>>2]|0)>>>0);c[aa>>2]=c[ha>>2];c[da>>2]=(c[j>>2]|0)-(ea(c[x>>2]|0,c[$>>2]|0)|0);c[ja>>2]=(c[ia>>2]|0)-(c[v>>2]|0);c[da>>2]=(c[da>>2]|0)-(c[x>>2]|0)-((c[ia>>2]|0)>>>0<(c[v>>2]|0)>>>0);c[j>>2]=c[ja>>2];c[ka>>2]=c[v>>2];c[la>>2]=c[$>>2];c[ma>>2]=c[ka>>2]&65535;c[na>>2]=(c[ka>>2]|0)>>>16;c[oa>>2]=c[la>>2]&65535;c[pa>>2]=(c[la>>2]|0)>>>16;c[Y>>2]=ea(c[ma>>2]|0,c[oa>>2]|0)|0;c[W>>2]=ea(c[ma>>2]|0,c[pa>>2]|0)|0;c[qa>>2]=ea(c[na>>2]|0,c[oa>>2]|0)|0;c[V>>2]=ea(c[na>>2]|0,c[pa>>2]|0)|0;c[W>>2]=(c[W>>2]|0)+((c[Y>>2]|0)>>>16);c[W>>2]=(c[W>>2]|0)+(c[qa>>2]|0);if((c[W>>2]|0)>>>0<(c[qa>>2]|0)>>>0){c[V>>2]=(c[V>>2]|0)+65536}c[X>>2]=(c[V>>2]|0)+((c[W>>2]|0)>>>16);c[Z>>2]=(c[W>>2]<<16)+(c[Y>>2]&65535);c[_>>2]=(c[j>>2]|0)-(c[Z>>2]|0);c[da>>2]=(c[da>>2]|0)-(c[X>>2]|0)-((c[j>>2]|0)>>>0<(c[Z>>2]|0)>>>0);c[j>>2]=c[_>>2];c[$>>2]=(c[$>>2]|0)+1;c[ba>>2]=0-((c[da>>2]|0)>>>0>=(c[aa>>2]|0)>>>0);c[$>>2]=(c[$>>2]|0)+(c[ba>>2]|0);c[ca>>2]=(c[j>>2]|0)+(c[ba>>2]&c[v>>2]);c[da>>2]=(c[da>>2]|0)+(c[ba>>2]&c[x>>2])+((c[ca>>2]|0)>>>0<(c[j>>2]|0)>>>0);c[j>>2]=c[ca>>2];do{if((((c[da>>2]|0)>>>0>=(c[x>>2]|0)>>>0|0)!=0|0)!=0){if(!((c[da>>2]|0)>>>0>(c[x>>2]|0)>>>0)?!((c[j>>2]|0)>>>0>=(c[v>>2]|0)>>>0):0){break}c[$>>2]=(c[$>>2]|0)+1;c[ya>>2]=(c[j>>2]|0)-(c[v>>2]|0);c[da>>2]=(c[da>>2]|0)-(c[x>>2]|0)-((c[j>>2]|0)>>>0<(c[v>>2]|0)>>>0);c[j>>2]=c[ya>>2]}}while(0);c[h>>2]=(c[h>>2]|0)+ -4;c[(c[T>>2]|0)+(c[S>>2]<<2)>>2]=c[$>>2];c[S>>2]=(c[S>>2]|0)+ -1}if((((c[U>>2]|0)!=0|0)!=0|0)==0){Za=c[da>>2]|0;a=c[h>>2]|0;a=a+4|0;c[a>>2]=Za;a=c[j>>2]|0;Za=c[h>>2]|0;c[Za>>2]=a;Za=c[k>>2]|0;i=l;return Za|0}c[T>>2]=(c[T>>2]|0)+(0-(c[U>>2]|0)<<2);c[S>>2]=(c[U>>2]|0)-1;while(1){if((c[S>>2]|0)<0){break}c[K>>2]=c[da>>2];c[M>>2]=c[L>>2];c[N>>2]=c[K>>2]&65535;c[O>>2]=(c[K>>2]|0)>>>16;c[P>>2]=c[M>>2]&65535;c[Q>>2]=(c[M>>2]|0)>>>16;c[A>>2]=ea(c[N>>2]|0,c[P>>2]|0)|0;c[z>>2]=ea(c[N>>2]|0,c[Q>>2]|0)|0;c[R>>2]=ea(c[O>>2]|0,c[P>>2]|0)|0;c[y>>2]=ea(c[O>>2]|0,c[Q>>2]|0)|0;c[z>>2]=(c[z>>2]|0)+((c[A>>2]|0)>>>16);c[z>>2]=(c[z>>2]|0)+(c[R>>2]|0);if((c[z>>2]|0)>>>0<(c[R>>2]|0)>>>0){c[y>>2]=(c[y>>2]|0)+65536}c[s>>2]=(c[y>>2]|0)+((c[z>>2]|0)>>>16);c[t>>2]=(c[z>>2]<<16)+(c[A>>2]&65535);c[B>>2]=(c[t>>2]|0)+(c[j>>2]|0);c[s>>2]=(c[s>>2]|0)+(c[da>>2]|0)+((c[B>>2]|0)>>>0<(c[t>>2]|0)>>>0);c[t>>2]=c[B>>2];c[da>>2]=(c[j>>2]|0)-(ea(c[x>>2]|0,c[s>>2]|0)|0);c[C>>2]=0-(c[v>>2]|0);c[da>>2]=(c[da>>2]|0)-(c[x>>2]|0)-(0<(c[v>>2]|0)>>>0);c[j>>2]=c[C>>2];c[D>>2]=c[v>>2];c[E>>2]=c[s>>2];c[F>>2]=c[D>>2]&65535;c[G>>2]=(c[D>>2]|0)>>>16;c[H>>2]=c[E>>2]&65535;c[I>>2]=(c[E>>2]|0)>>>16;c[p>>2]=ea(c[F>>2]|0,c[H>>2]|0)|0;c[n>>2]=ea(c[F>>2]|0,c[I>>2]|0)|0;c[J>>2]=ea(c[G>>2]|0,c[H>>2]|0)|0;c[m>>2]=ea(c[G>>2]|0,c[I>>2]|0)|0;c[n>>2]=(c[n>>2]|0)+((c[p>>2]|0)>>>16);c[n>>2]=(c[n>>2]|0)+(c[J>>2]|0);if((c[n>>2]|0)>>>0<(c[J>>2]|0)>>>0){c[m>>2]=(c[m>>2]|0)+65536}c[o>>2]=(c[m>>2]|0)+((c[n>>2]|0)>>>16);c[q>>2]=(c[n>>2]<<16)+(c[p>>2]&65535);c[r>>2]=(c[j>>2]|0)-(c[q>>2]|0);c[da>>2]=(c[da>>2]|0)-(c[o>>2]|0)-((c[j>>2]|0)>>>0<(c[q>>2]|0)>>>0);c[j>>2]=c[r>>2];c[s>>2]=(c[s>>2]|0)+1;c[u>>2]=0-((c[da>>2]|0)>>>0>=(c[t>>2]|0)>>>0);c[s>>2]=(c[s>>2]|0)+(c[u>>2]|0);c[w>>2]=(c[j>>2]|0)+(c[u>>2]&c[v>>2]);c[da>>2]=(c[da>>2]|0)+(c[u>>2]&c[x>>2])+((c[w>>2]|0)>>>0<(c[j>>2]|0)>>>0);c[j>>2]=c[w>>2];do{if((((c[da>>2]|0)>>>0>=(c[x>>2]|0)>>>0|0)!=0|0)!=0){if(!((c[da>>2]|0)>>>0>(c[x>>2]|0)>>>0)?!((c[j>>2]|0)>>>0>=(c[v>>2]|0)>>>0):0){break}c[s>>2]=(c[s>>2]|0)+1;c[Da>>2]=(c[j>>2]|0)-(c[v>>2]|0);c[da>>2]=(c[da>>2]|0)-(c[x>>2]|0)-((c[j>>2]|0)>>>0<(c[v>>2]|0)>>>0);c[j>>2]=c[Da>>2]}}while(0);c[(c[T>>2]|0)+(c[S>>2]<<2)>>2]=c[s>>2];c[S>>2]=(c[S>>2]|0)+ -1}Za=c[da>>2]|0;a=c[h>>2]|0;a=a+4|0;c[a>>2]=Za;a=c[j>>2]|0;Za=c[h>>2]|0;c[Za>>2]=a;Za=c[k>>2]|0;i=l;return Za|0}function Ce(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=i;i=i+48|0;g=h+32|0;f=h+28|0;p=h+24|0;o=h+20|0;l=h+16|0;m=h+12|0;n=h+8|0;k=h+4|0;j=h;c[g>>2]=a;c[f>>2]=b;c[p>>2]=d;c[o>>2]=e;c[f>>2]=(c[f>>2]|0)+(c[p>>2]<<2);c[g>>2]=(c[g>>2]|0)+(c[p>>2]<<2);c[n>>2]=32-(c[o>>2]|0);a=(c[f>>2]|0)+ -4|0;c[f>>2]=a;c[m>>2]=c[a>>2];c[j>>2]=(c[m>>2]|0)>>>(c[n>>2]|0);c[l>>2]=c[m>>2]<<c[o>>2];c[k>>2]=(c[p>>2]|0)-1;while(1){if((c[k>>2]|0)==0){break}a=(c[f>>2]|0)+ -4|0;c[f>>2]=a;c[m>>2]=c[a>>2];a=~(c[l>>2]|(c[m>>2]|0)>>>(c[n>>2]|0));p=(c[g>>2]|0)+ -4|0;c[g>>2]=p;c[p>>2]=a;c[l>>2]=c[m>>2]<<c[o>>2];c[k>>2]=(c[k>>2]|0)+ -1}a=~c[l>>2];p=(c[g>>2]|0)+ -4|0;c[g>>2]=p;c[p>>2]=a;i=h;return c[j>>2]|0}function De(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0;g=i;i=i+384|0;h=g+376|0;n=g+372|0;j=g+368|0;l=g+364|0;k=g+360|0;Y=g+240|0;X=g+236|0;fa=g+232|0;ta=g+228|0;ea=g+224|0;sa=g+220|0;ra=g+216|0;qa=g+212|0;ma=g+208|0;na=g+204|0;oa=g+200|0;pa=g+196|0;V=g+192|0;W=g+188|0;C=g+184|0;G=g+180|0;J=g+176|0;ga=g+172|0;ha=g+168|0;ia=g+164|0;ja=g+160|0;la=g+156|0;ka=g+152|0;L=g+148|0;K=g+144|0;I=g+140|0;M=g+136|0;F=g+132|0;H=g+128|0;m=g+124|0;u=g+120|0;r=g+116|0;x=g+112|0;w=g+108|0;B=g+104|0;A=g+100|0;y=g+96|0;z=g+92|0;t=g+88|0;s=g+84|0;v=g+80|0;p=g+76|0;q=g+72|0;o=g+68|0;D=g+64|0;E=g+60|0;R=g+56|0;Q=g+52|0;T=g+48|0;da=g+44|0;ba=g+40|0;ca=g+36|0;aa=g+32|0;$=g+28|0;_=g+24|0;P=g+20|0;U=g+16|0;N=g+12|0;S=g+8|0;Z=g+4|0;O=g;c[h>>2]=a;c[n>>2]=b;c[j>>2]=d;c[l>>2]=e;c[k>>2]=f;if((c[j>>2]|0)==(c[k>>2]|0)){m=c[h>>2]|0;o=c[n>>2]|0;if((c[n>>2]|0)==(c[l>>2]|0)){Xe(m,o,c[j>>2]|0);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}else{We(m,o,c[l>>2]|0,c[j>>2]|0);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}}if((c[k>>2]|0)<30){if((c[j>>2]|0)>500?(c[k>>2]|0)!=1:0){Ye(c[h>>2]|0,c[n>>2]|0,500,c[l>>2]|0,c[k>>2]|0);c[h>>2]=(c[h>>2]|0)+2e3;if((c[k>>2]|0)!=0){c[fa>>2]=(c[k>>2]|0)-1;c[ta>>2]=Y;c[ea>>2]=c[h>>2];a=c[ea>>2]|0;c[ea>>2]=a+4;c[sa>>2]=c[a>>2];if((c[fa>>2]|0)!=0){do{b=c[sa>>2]|0;a=c[ta>>2]|0;c[ta>>2]=a+4;c[a>>2]=b;a=c[ea>>2]|0;c[ea>>2]=a+4;c[sa>>2]=c[a>>2];a=(c[fa>>2]|0)+ -1|0;c[fa>>2]=a}while((a|0)!=0)}b=c[sa>>2]|0;a=c[ta>>2]|0;c[ta>>2]=a+4;c[a>>2]=b}c[n>>2]=(c[n>>2]|0)+2e3;c[j>>2]=(c[j>>2]|0)-500;while(1){if((c[j>>2]|0)<=500){break}Ye(c[h>>2]|0,c[n>>2]|0,500,c[l>>2]|0,c[k>>2]|0);c[X>>2]=qe(c[h>>2]|0,c[h>>2]|0,Y,c[k>>2]|0)|0;c[qa>>2]=(c[h>>2]|0)+(c[k>>2]<<2);c[ra>>2]=(c[c[qa>>2]>>2]|0)+(c[X>>2]|0);c[c[qa>>2]>>2]=c[ra>>2];if((c[ra>>2]|0)>>>0<(c[X>>2]|0)>>>0){do{b=(c[qa>>2]|0)+4|0;c[qa>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[h>>2]=(c[h>>2]|0)+2e3;if((c[k>>2]|0)!=0){c[ma>>2]=(c[k>>2]|0)-1;c[na>>2]=Y;c[oa>>2]=c[h>>2];a=c[oa>>2]|0;c[oa>>2]=a+4;c[pa>>2]=c[a>>2];if((c[ma>>2]|0)!=0){do{b=c[pa>>2]|0;a=c[na>>2]|0;c[na>>2]=a+4;c[a>>2]=b;a=c[oa>>2]|0;c[oa>>2]=a+4;c[pa>>2]=c[a>>2];a=(c[ma>>2]|0)+ -1|0;c[ma>>2]=a}while((a|0)!=0)}b=c[pa>>2]|0;a=c[na>>2]|0;c[na>>2]=a+4;c[a>>2]=b}c[n>>2]=(c[n>>2]|0)+2e3;c[j>>2]=(c[j>>2]|0)-500}m=c[h>>2]|0;if((c[j>>2]|0)>(c[k>>2]|0)){Ye(m,c[n>>2]|0,c[j>>2]|0,c[l>>2]|0,c[k>>2]|0)}else{Ye(m,c[l>>2]|0,c[k>>2]|0,c[n>>2]|0,c[j>>2]|0)}c[X>>2]=qe(c[h>>2]|0,c[h>>2]|0,Y,c[k>>2]|0)|0;c[W>>2]=(c[h>>2]|0)+(c[k>>2]<<2);c[V>>2]=(c[c[W>>2]>>2]|0)+(c[X>>2]|0);c[c[W>>2]>>2]=c[V>>2];if(!((c[V>>2]|0)>>>0<(c[X>>2]|0)>>>0)){b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}do{b=(c[W>>2]|0)+4|0;c[W>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}Ye(c[h>>2]|0,c[n>>2]|0,c[j>>2]|0,c[l>>2]|0,c[k>>2]|0);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}if((c[k>>2]|0)<100){a=i;i=i+((1*((c[k>>2]<<4)+100<<2)|0)+15&-16)|0;c[C>>2]=a;if((c[j>>2]|0)<((c[k>>2]|0)*3|0)){if((c[j>>2]<<2|0)<((c[k>>2]|0)*5|0)){hf(c[h>>2]|0,c[n>>2]|0,c[j>>2]|0,c[l>>2]|0,c[k>>2]|0,c[C>>2]|0);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}m=c[h>>2]|0;o=c[n>>2]|0;n=c[j>>2]|0;p=c[l>>2]|0;l=c[k>>2]|0;q=c[C>>2]|0;if((c[j>>2]<<2|0)<((c[k>>2]|0)*7|0)){kf(m,o,n,p,l,q);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}else{of(m,o,n,p,l,q);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}}a=i;i=i+((1*(c[k>>2]<<2<<2)|0)+15&-16)|0;c[J>>2]=a;of(c[h>>2]|0,c[n>>2]|0,c[k>>2]<<1,c[l>>2]|0,c[k>>2]|0,c[C>>2]|0);c[j>>2]=(c[j>>2]|0)-(c[k>>2]<<1);c[n>>2]=(c[n>>2]|0)+(c[k>>2]<<1<<2);c[h>>2]=(c[h>>2]|0)+(c[k>>2]<<1<<2);while(1){if((c[j>>2]|0)<((c[k>>2]|0)*3|0)){break}of(c[J>>2]|0,c[n>>2]|0,c[k>>2]<<1,c[l>>2]|0,c[k>>2]|0,c[C>>2]|0);c[j>>2]=(c[j>>2]|0)-(c[k>>2]<<1);c[n>>2]=(c[n>>2]|0)+(c[k>>2]<<1<<2);c[G>>2]=qe(c[h>>2]|0,c[h>>2]|0,c[J>>2]|0,c[k>>2]|0)|0;if((c[k>>2]<<1|0)!=0){c[ga>>2]=(c[k>>2]<<1)-1;c[ha>>2]=(c[h>>2]|0)+(c[k>>2]<<2);c[ia>>2]=(c[J>>2]|0)+(c[k>>2]<<2);a=c[ia>>2]|0;c[ia>>2]=a+4;c[ja>>2]=c[a>>2];if((c[ga>>2]|0)!=0){do{b=c[ja>>2]|0;a=c[ha>>2]|0;c[ha>>2]=a+4;c[a>>2]=b;a=c[ia>>2]|0;c[ia>>2]=a+4;c[ja>>2]=c[a>>2];a=(c[ga>>2]|0)+ -1|0;c[ga>>2]=a}while((a|0)!=0)}b=c[ja>>2]|0;a=c[ha>>2]|0;c[ha>>2]=a+4;c[a>>2]=b}c[ka>>2]=(c[h>>2]|0)+(c[k>>2]<<2);c[la>>2]=(c[c[ka>>2]>>2]|0)+(c[G>>2]|0);c[c[ka>>2]>>2]=c[la>>2];if((c[la>>2]|0)>>>0<(c[G>>2]|0)>>>0){do{b=(c[ka>>2]|0)+4|0;c[ka>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[h>>2]=(c[h>>2]|0)+(c[k>>2]<<1<<2)}do{if((c[j>>2]<<2|0)>=((c[k>>2]|0)*5|0)){m=c[J>>2]|0;n=c[n>>2]|0;o=c[j>>2]|0;l=c[l>>2]|0;p=c[k>>2]|0;q=c[C>>2]|0;if((c[j>>2]<<2|0)<((c[k>>2]|0)*7|0)){kf(m,n,o,l,p,q);break}else{of(m,n,o,l,p,q);break}}else{hf(c[J>>2]|0,c[n>>2]|0,c[j>>2]|0,c[l>>2]|0,c[k>>2]|0,c[C>>2]|0)}}while(0);c[G>>2]=qe(c[h>>2]|0,c[h>>2]|0,c[J>>2]|0,c[k>>2]|0)|0;if((c[j>>2]|0)!=0){c[L>>2]=(c[j>>2]|0)-1;c[K>>2]=(c[h>>2]|0)+(c[k>>2]<<2);c[I>>2]=(c[J>>2]|0)+(c[k>>2]<<2);a=c[I>>2]|0;c[I>>2]=a+4;c[M>>2]=c[a>>2];if((c[L>>2]|0)!=0){do{b=c[M>>2]|0;a=c[K>>2]|0;c[K>>2]=a+4;c[a>>2]=b;a=c[I>>2]|0;c[I>>2]=a+4;c[M>>2]=c[a>>2];a=(c[L>>2]|0)+ -1|0;c[L>>2]=a}while((a|0)!=0)}b=c[M>>2]|0;a=c[K>>2]|0;c[K>>2]=a+4;c[a>>2]=b}c[H>>2]=(c[h>>2]|0)+(c[k>>2]<<2);c[F>>2]=(c[c[H>>2]>>2]|0)+(c[G>>2]|0);c[c[H>>2]>>2]=c[F>>2];if(!((c[F>>2]|0)>>>0<(c[G>>2]|0)>>>0)){b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}do{b=(c[H>>2]|0)+4|0;c[H>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}if(((c[j>>2]|0)+(c[k>>2]|0)>>1|0)>=3e3?((c[k>>2]|0)*3|0)>=3e3:0){if((c[j>>2]|0)<(c[k>>2]<<3|0)){_e(c[h>>2]|0,c[n>>2]|0,c[j>>2]|0,c[l>>2]|0,c[k>>2]|0);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}c[T>>2]=0;c[Q>>2]=Nd(T,(c[k>>2]|0)*9>>1<<2)|0;_e(c[h>>2]|0,c[n>>2]|0,(c[k>>2]|0)*3|0,c[l>>2]|0,c[k>>2]|0);c[j>>2]=(c[j>>2]|0)-((c[k>>2]|0)*3|0);c[n>>2]=(c[n>>2]|0)+((c[k>>2]|0)*3<<2);c[h>>2]=(c[h>>2]|0)+((c[k>>2]|0)*3<<2);while(1){if((c[j>>2]<<1|0)<((c[k>>2]|0)*7|0)){break}_e(c[Q>>2]|0,c[n>>2]|0,(c[k>>2]|0)*3|0,c[l>>2]|0,c[k>>2]|0);c[j>>2]=(c[j>>2]|0)-((c[k>>2]|0)*3|0);c[n>>2]=(c[n>>2]|0)+((c[k>>2]|0)*3<<2);c[R>>2]=qe(c[h>>2]|0,c[h>>2]|0,c[Q>>2]|0,c[k>>2]|0)|0;if(((c[k>>2]|0)*3|0)!=0){c[da>>2]=((c[k>>2]|0)*3|0)-1;c[ba>>2]=(c[h>>2]|0)+(c[k>>2]<<2);c[ca>>2]=(c[Q>>2]|0)+(c[k>>2]<<2);a=c[ca>>2]|0;c[ca>>2]=a+4;c[aa>>2]=c[a>>2];if((c[da>>2]|0)!=0){do{b=c[aa>>2]|0;a=c[ba>>2]|0;c[ba>>2]=a+4;c[a>>2]=b;a=c[ca>>2]|0;c[ca>>2]=a+4;c[aa>>2]=c[a>>2];a=(c[da>>2]|0)+ -1|0;c[da>>2]=a}while((a|0)!=0)}b=c[aa>>2]|0;a=c[ba>>2]|0;c[ba>>2]=a+4;c[a>>2]=b}c[_>>2]=(c[h>>2]|0)+(c[k>>2]<<2);c[$>>2]=(c[c[_>>2]>>2]|0)+(c[R>>2]|0);c[c[_>>2]>>2]=c[$>>2];if((c[$>>2]|0)>>>0<(c[R>>2]|0)>>>0){do{b=(c[_>>2]|0)+4|0;c[_>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[h>>2]=(c[h>>2]|0)+((c[k>>2]|0)*3<<2)}m=c[Q>>2]|0;if((c[j>>2]|0)<(c[k>>2]|0)){De(m,c[l>>2]|0,c[k>>2]|0,c[n>>2]|0,c[j>>2]|0)|0}else{De(m,c[n>>2]|0,c[j>>2]|0,c[l>>2]|0,c[k>>2]|0)|0}c[R>>2]=qe(c[h>>2]|0,c[h>>2]|0,c[Q>>2]|0,c[k>>2]|0)|0;if((c[j>>2]|0)!=0){c[P>>2]=(c[j>>2]|0)-1;c[U>>2]=(c[h>>2]|0)+(c[k>>2]<<2);c[N>>2]=(c[Q>>2]|0)+(c[k>>2]<<2);a=c[N>>2]|0;c[N>>2]=a+4;c[S>>2]=c[a>>2];if((c[P>>2]|0)!=0){do{b=c[S>>2]|0;a=c[U>>2]|0;c[U>>2]=a+4;c[a>>2]=b;a=c[N>>2]|0;c[N>>2]=a+4;c[S>>2]=c[a>>2];a=(c[P>>2]|0)+ -1|0;c[P>>2]=a}while((a|0)!=0)}b=c[S>>2]|0;a=c[U>>2]|0;c[U>>2]=a+4;c[a>>2]=b}c[O>>2]=(c[h>>2]|0)+(c[k>>2]<<2);c[Z>>2]=(c[c[O>>2]>>2]|0)+(c[R>>2]|0);c[c[O>>2]>>2]=c[Z>>2];if((c[Z>>2]|0)>>>0<(c[R>>2]|0)>>>0){do{b=(c[O>>2]|0)+4|0;c[O>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}if((((c[T>>2]|0)!=0|0)!=0|0)==0){b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}Od(c[T>>2]|0);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}if((c[k>>2]|0)>=300?(12+((c[j>>2]|0)*3|0)|0)<(c[k>>2]<<2|0):0){c[E>>2]=0;do{if((c[k>>2]|0)>=350){m=c[j>>2]|0;o=c[k>>2]|0;if((c[k>>2]|0)>=450){a=(((Fe(m,o)|0)<<2>>>0<65536|0)!=0|0)!=0;m=(Fe(c[j>>2]|0,c[k>>2]|0)|0)<<2;if(a){a=i;i=i+((1*m|0)+15&-16)|0;m=a}else{m=Nd(E,m)|0}c[D>>2]=m;zf(c[h>>2]|0,c[n>>2]|0,c[j>>2]|0,c[l>>2]|0,c[k>>2]|0,c[D>>2]|0);break}else{a=(((Ee(m,o)|0)<<2>>>0<65536|0)!=0|0)!=0;m=(Ee(c[j>>2]|0,c[k>>2]|0)|0)<<2;if(a){a=i;i=i+((1*m|0)+15&-16)|0;m=a}else{m=Nd(E,m)|0}c[D>>2]=m;xf(c[h>>2]|0,c[n>>2]|0,c[j>>2]|0,c[l>>2]|0,c[k>>2]|0,c[D>>2]|0);break}}else{m=((c[j>>2]|0)*3|0)+32<<2;if(((((c[j>>2]|0)*3|0)+32<<2>>>0<65536|0)!=0|0)!=0){a=i;i=i+((1*m|0)+15&-16)|0;m=a}else{m=Nd(E,m)|0}c[D>>2]=m;wf(c[h>>2]|0,c[n>>2]|0,c[j>>2]|0,c[l>>2]|0,c[k>>2]|0,c[D>>2]|0)}}while(0);if((((c[E>>2]|0)!=0|0)!=0|0)==0){b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}Od(c[E>>2]|0);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}a=i;i=i+((1*((c[k>>2]<<4)+100<<2)|0)+15&-16)|0;c[m>>2]=a;if((c[j>>2]<<1|0)<((c[k>>2]|0)*5|0)){if(((c[j>>2]|0)*6|0)<((c[k>>2]|0)*7|0)){qf(c[h>>2]|0,c[n>>2]|0,c[j>>2]|0,c[l>>2]|0,c[k>>2]|0,c[m>>2]|0);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}if((c[j>>2]<<1|0)<((c[k>>2]|0)*3|0)){o=c[h>>2]|0;p=c[n>>2]|0;n=c[j>>2]|0;l=c[l>>2]|0;q=c[k>>2]|0;m=c[m>>2]|0;if((c[k>>2]|0)>=100){rf(o,p,n,l,q,m);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}else{kf(o,p,n,l,q,m);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}}if(((c[j>>2]|0)*6|0)>=((c[k>>2]|0)*11|0)){o=c[h>>2]|0;n=c[n>>2]|0;p=c[j>>2]|0;q=c[l>>2]|0;l=c[k>>2]|0;m=c[m>>2]|0;if((c[k>>2]|0)>=110){tf(o,n,p,q,l,m);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}else{of(o,n,p,q,l,m);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}}o=c[k>>2]|0;if((c[j>>2]<<2|0)<((c[k>>2]|0)*7|0)){p=c[h>>2]|0;q=c[n>>2]|0;n=c[j>>2]|0;r=c[l>>2]|0;l=c[k>>2]|0;m=c[m>>2]|0;if((o|0)>=110){sf(p,q,n,r,l,m);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}else{kf(p,q,n,r,l,m);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}}else{p=c[h>>2]|0;q=c[n>>2]|0;n=c[j>>2]|0;l=c[l>>2]|0;r=c[k>>2]|0;m=c[m>>2]|0;if((o|0)>=100){sf(p,q,n,l,r,m);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}else{of(p,q,n,l,r,m);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}}}else{D=i;i=i+((1*((c[k>>2]|0)*7>>1<<2)|0)+15&-16)|0;c[r>>2]=D;D=c[h>>2]|0;E=c[n>>2]|0;F=c[k>>2]<<1;G=c[l>>2]|0;H=c[k>>2]|0;C=c[m>>2]|0;if((c[k>>2]|0)>=110){tf(D,E,F,G,H,C)}else{of(D,E,F,G,H,C)}c[j>>2]=(c[j>>2]|0)-(c[k>>2]<<1);c[n>>2]=(c[n>>2]|0)+(c[k>>2]<<1<<2);c[h>>2]=(c[h>>2]|0)+(c[k>>2]<<1<<2);while(1){if((c[j>>2]<<1|0)<((c[k>>2]|0)*5|0)){break}C=c[r>>2]|0;D=c[n>>2]|0;H=c[k>>2]<<1;G=c[l>>2]|0;F=c[k>>2]|0;E=c[m>>2]|0;if((c[k>>2]|0)>=110){tf(C,D,H,G,F,E)}else{of(C,D,H,G,F,E)}c[j>>2]=(c[j>>2]|0)-(c[k>>2]<<1);c[n>>2]=(c[n>>2]|0)+(c[k>>2]<<1<<2);c[u>>2]=qe(c[h>>2]|0,c[h>>2]|0,c[r>>2]|0,c[k>>2]|0)|0;if((c[k>>2]<<1|0)!=0){c[x>>2]=(c[k>>2]<<1)-1;c[w>>2]=(c[h>>2]|0)+(c[k>>2]<<2);c[B>>2]=(c[r>>2]|0)+(c[k>>2]<<2);a=c[B>>2]|0;c[B>>2]=a+4;c[A>>2]=c[a>>2];if((c[x>>2]|0)!=0){do{b=c[A>>2]|0;a=c[w>>2]|0;c[w>>2]=a+4;c[a>>2]=b;a=c[B>>2]|0;c[B>>2]=a+4;c[A>>2]=c[a>>2];a=(c[x>>2]|0)+ -1|0;c[x>>2]=a}while((a|0)!=0)}b=c[A>>2]|0;a=c[w>>2]|0;c[w>>2]=a+4;c[a>>2]=b}c[z>>2]=(c[h>>2]|0)+(c[k>>2]<<2);c[y>>2]=(c[c[z>>2]>>2]|0)+(c[u>>2]|0);c[c[z>>2]>>2]=c[y>>2];if((c[y>>2]|0)>>>0<(c[u>>2]|0)>>>0){do{b=(c[z>>2]|0)+4|0;c[z>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[h>>2]=(c[h>>2]|0)+(c[k>>2]<<1<<2)}m=c[r>>2]|0;if((c[j>>2]|0)<(c[k>>2]|0)){De(m,c[l>>2]|0,c[k>>2]|0,c[n>>2]|0,c[j>>2]|0)|0}else{De(m,c[n>>2]|0,c[j>>2]|0,c[l>>2]|0,c[k>>2]|0)|0}c[u>>2]=qe(c[h>>2]|0,c[h>>2]|0,c[r>>2]|0,c[k>>2]|0)|0;if((c[j>>2]|0)!=0){c[t>>2]=(c[j>>2]|0)-1;c[s>>2]=(c[h>>2]|0)+(c[k>>2]<<2);c[v>>2]=(c[r>>2]|0)+(c[k>>2]<<2);a=c[v>>2]|0;c[v>>2]=a+4;c[p>>2]=c[a>>2];if((c[t>>2]|0)!=0){do{b=c[p>>2]|0;a=c[s>>2]|0;c[s>>2]=a+4;c[a>>2]=b;a=c[v>>2]|0;c[v>>2]=a+4;c[p>>2]=c[a>>2];a=(c[t>>2]|0)+ -1|0;c[t>>2]=a}while((a|0)!=0)}b=c[p>>2]|0;a=c[s>>2]|0;c[s>>2]=a+4;c[a>>2]=b}c[o>>2]=(c[h>>2]|0)+(c[k>>2]<<2);c[q>>2]=(c[c[o>>2]>>2]|0)+(c[u>>2]|0);c[c[o>>2]>>2]=c[q>>2];if(!((c[q>>2]|0)>>>0<(c[u>>2]|0)>>>0)){b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}do{b=(c[o>>2]|0)+4|0;c[o>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0);b=c[j>>2]|0;a=c[k>>2]|0;a=b+a|0;a=a-1|0;b=c[h>>2]|0;a=b+(a<<2)|0;a=c[a>>2]|0;i=g;return a|0}return 0}function Ee(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;e=i;i=i+16|0;g=e+8|0;f=e+4|0;d=e;c[g>>2]=a;c[f>>2]=b;c[d>>2]=((((c[g>>2]|0)+(c[f>>2]|0)|0)>>>0)/10|0)+1;i=e;return(((c[d>>2]|0)*6|0)-350<<1)+1082|0}function Fe(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;e=i;i=i+16|0;g=e+8|0;f=e+4|0;d=e;c[g>>2]=a;c[f>>2]=b;c[d>>2]=((((c[g>>2]|0)+(c[f>>2]|0)|0)>>>0)/14|0)+1;i=e;return((c[d>>2]<<3)*15>>3)-843+1282|0}function Ge(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;g=i;i=i+16|0;f=g+12|0;h=g+8|0;j=g+4|0;e=g;c[h>>2]=a;c[j>>2]=b;c[e>>2]=0;while(1){if((c[13400+(c[j>>2]<<6)+(c[e>>2]<<2)>>2]|0)==0){break}b=c[e>>2]|0;if((c[h>>2]|0)<(c[13400+(c[j>>2]<<6)+(c[e>>2]<<2)>>2]|0)){d=4;break}c[e>>2]=b+1}if((d|0)==4){c[f>>2]=b+4;a=c[f>>2]|0;i=g;return a|0}if((c[e>>2]|0)!=0?(c[h>>2]|0)>=(c[13400+(c[j>>2]<<6)+((c[e>>2]|0)-1<<2)>>2]<<2|0):0){c[f>>2]=(c[e>>2]|0)+5;a=c[f>>2]|0;i=g;return a|0}c[f>>2]=(c[e>>2]|0)+4;a=c[f>>2]|0;i=g;return a|0}function He(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;f=i;i=i+16|0;e=f+4|0;d=f;c[e>>2]=a;c[d>>2]=b;c[e>>2]=1+((c[e>>2]|0)-1>>c[d>>2]);i=f;return c[e>>2]<<c[d>>2]|0}function Ie(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;G=i;i=i+112|0;A=G+108|0;x=G+104|0;D=G+100|0;E=G+96|0;k=G+92|0;B=G+88|0;l=G+84|0;K=G+80|0;y=G+76|0;J=G+72|0;H=G+68|0;C=G+64|0;q=G+60|0;I=G+56|0;s=G+52|0;r=G+48|0;m=G+44|0;n=G+40|0;o=G+36|0;u=G+32|0;p=G+28|0;t=G+24|0;L=G+20|0;v=G+16|0;w=G+12|0;j=G+8|0;F=G+4|0;z=G;c[A>>2]=a;c[x>>2]=b;c[D>>2]=d;c[E>>2]=e;c[k>>2]=f;c[B>>2]=g;c[l>>2]=h;if((c[D>>2]|0)==(c[k>>2]|0)){h=(c[E>>2]|0)==(c[B>>2]|0)}else{h=0}c[v>>2]=h&1;a=He(c[x>>2]|0,c[l>>2]|0)|0;if(((((a|0)==(c[x>>2]|0)^1)&1|0)!=0|0)!=0){Hd(13528,841,13584)}c[j>>2]=0;c[H>>2]=c[x>>2]<<5;c[t>>2]=Nd(j,(c[l>>2]|0)+1<<2)|0;c[L>>2]=Nd(j,2<<c[l>>2]<<2)|0;c[K>>2]=0;while(1){if((c[K>>2]|0)>(c[l>>2]|0)){break}c[(c[t>>2]|0)+(c[K>>2]<<2)>>2]=c[L>>2];c[L>>2]=(c[L>>2]|0)+(1<<c[K>>2]<<2);c[K>>2]=(c[K>>2]|0)+1}Je(c[t>>2]|0,c[l>>2]|0);c[y>>2]=1<<c[l>>2];c[I>>2]=c[H>>2]>>c[l>>2];c[r>>2]=1+(((c[I>>2]|0)-1|0)/32|0);c[J>>2]=Ke(32,c[l>>2]|0)|0;c[C>>2]=ea(1+(((c[I>>2]<<1)+(c[l>>2]|0)+2|0)/(c[J>>2]|0)|0)|0,c[J>>2]|0)|0;c[q>>2]=(c[C>>2]|0)/32|0;a:do{if((c[q>>2]|0)>=(((c[v>>2]|0)!=0?360:300)|0)){while(1){c[F>>2]=1<<(Ge(c[q>>2]|0,c[v>>2]|0)|0);if((c[q>>2]&(c[F>>2]|0)-1|0)==0){break a}c[q>>2]=(c[q>>2]|0)+(c[F>>2]|0)-1&0-(c[F>>2]|0);c[C>>2]=c[q>>2]<<5}}}while(0);if(((((c[q>>2]|0)<(c[x>>2]|0)^1)&1|0)!=0|0)!=0){Hd(13528,879,13624)}c[u>>2]=Nd(j,(c[q>>2]|0)+1<<1<<2)|0;c[s>>2]=c[C>>2]>>c[l>>2];c[o>>2]=Nd(j,(ea(c[y>>2]|0,(c[q>>2]|0)+1|0)|0)<<2)|0;c[m>>2]=Nd(j,c[y>>2]<<2)|0;Le(c[o>>2]|0,c[m>>2]|0,c[y>>2]|0,c[q>>2]|0,c[D>>2]|0,c[E>>2]|0,c[r>>2]|0,c[s>>2]|0,c[u>>2]|0);if((c[v>>2]|0)!=0){a=ea(c[r>>2]|0,(c[y>>2]|0)-1|0)|0;c[z>>2]=a+(c[q>>2]|0)+1;c[p>>2]=Nd(j,c[z>>2]<<2)|0;c[n>>2]=Nd(j,c[y>>2]<<2)|0}else{c[p>>2]=Nd(j,(ea(c[y>>2]|0,(c[q>>2]|0)+1|0)|0)<<2)|0;c[n>>2]=Nd(j,c[y>>2]<<2)|0;Le(c[p>>2]|0,c[n>>2]|0,c[y>>2]|0,c[q>>2]|0,c[k>>2]|0,c[B>>2]|0,c[r>>2]|0,c[s>>2]|0,c[u>>2]|0)}c[w>>2]=Me(c[A>>2]|0,c[x>>2]|0,c[l>>2]|0,c[m>>2]|0,c[n>>2]|0,c[o>>2]|0,c[p>>2]|0,c[q>>2]|0,c[r>>2]|0,c[s>>2]|0,c[t>>2]|0,c[u>>2]|0,c[v>>2]|0)|0;if((((c[j>>2]|0)!=0|0)!=0|0)==0){a=c[w>>2]|0;i=G;return a|0}Od(c[j>>2]|0);a=c[w>>2]|0;i=G;return a|0}function Je(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+32|0;g=d+20|0;k=d+16|0;h=d+12|0;e=d+8|0;f=d+4|0;j=d;c[g>>2]=a;c[k>>2]=b;c[c[c[g>>2]>>2]>>2]=0;c[h>>2]=1;c[f>>2]=1;while(1){if((c[h>>2]|0)>(c[k>>2]|0)){break}c[j>>2]=c[(c[g>>2]|0)+(c[h>>2]<<2)>>2];c[e>>2]=0;while(1){if((c[e>>2]|0)>=(c[f>>2]|0)){break}c[(c[j>>2]|0)+(c[e>>2]<<2)>>2]=c[(c[(c[g>>2]|0)+((c[h>>2]|0)-1<<2)>>2]|0)+(c[e>>2]<<2)>>2]<<1;c[(c[j>>2]|0)+((c[f>>2]|0)+(c[e>>2]|0)<<2)>>2]=1+(c[(c[j>>2]|0)+(c[e>>2]<<2)>>2]|0);c[e>>2]=(c[e>>2]|0)+1}c[h>>2]=(c[h>>2]|0)+1;c[f>>2]=c[f>>2]<<1}i=d;return}function Ke(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;f=d+8|0;g=d+4|0;e=d;c[f>>2]=a;c[g>>2]=b;c[e>>2]=c[g>>2];while(1){if((((c[f>>2]|0)>>>0)%2|0|0)==0){a=(c[g>>2]|0)>0}else{a=0}b=c[f>>2]|0;if(!a){break}c[f>>2]=b>>>1;c[g>>2]=(c[g>>2]|0)+ -1}i=d;return b<<c[e>>2]|0}function Le(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;F=i;i=i+112|0;n=F+96|0;s=F+92|0;u=F+88|0;p=F+84|0;z=F+80|0;v=F+76|0;r=F+72|0;E=F+68|0;m=F+64|0;t=F+60|0;l=F+56|0;H=F+52|0;I=F+48|0;x=F+44|0;J=F+40|0;G=F+36|0;K=F+32|0;w=F+28|0;y=F+24|0;A=F+20|0;B=F+16|0;C=F+12|0;D=F+8|0;o=F+4|0;q=F;c[n>>2]=a;c[s>>2]=b;c[u>>2]=d;c[p>>2]=e;c[z>>2]=f;c[v>>2]=g;c[r>>2]=h;c[E>>2]=j;c[m>>2]=k;c[I>>2]=ea(c[u>>2]|0,c[r>>2]|0)|0;c[x>>2]=0;if((c[v>>2]|0)>(c[I>>2]|0)){c[J>>2]=(c[v>>2]|0)-(c[I>>2]|0);c[H>>2]=Nd(x,(c[I>>2]|0)+1<<2)|0;do{if((c[J>>2]|0)>(c[I>>2]|0)){c[K>>2]=0;c[G>>2]=te(c[H>>2]|0,c[z>>2]|0,(c[z>>2]|0)+(c[I>>2]<<2)|0,c[I>>2]|0)|0;c[z>>2]=(c[z>>2]|0)+(c[I>>2]<<1<<2);c[J>>2]=(c[J>>2]|0)-(c[I>>2]|0);while(1){j=(c[K>>2]|0)!=0;k=c[H>>2]|0;h=c[H>>2]|0;if((c[J>>2]|0)<=(c[I>>2]|0)){break}g=c[z>>2]|0;f=c[I>>2]|0;if(j){a=te(k,h,g,f)|0;c[G>>2]=(c[G>>2]|0)+a}else{a=qe(k,h,g,f)|0;c[G>>2]=(c[G>>2]|0)-a}c[K>>2]=c[K>>2]^1;c[z>>2]=(c[z>>2]|0)+(c[I>>2]<<2);c[J>>2]=(c[J>>2]|0)-(c[I>>2]|0)}g=c[I>>2]|0;K=c[z>>2]|0;J=c[J>>2]|0;if(j){a=re(k,h,g,K,J)|0;c[G>>2]=(c[G>>2]|0)+a}else{a=oe(k,h,g,K,J)|0;c[G>>2]=(c[G>>2]|0)-a}j=c[H>>2]|0;k=c[H>>2]|0;K=c[I>>2]|0;J=c[G>>2]|0;if((c[G>>2]|0)>=0){c[G>>2]=pe(j,k,K,J)|0;break}else{c[G>>2]=se(j,k,K,0-J|0)|0;break}}else{c[G>>2]=re(c[H>>2]|0,c[z>>2]|0,c[I>>2]|0,(c[z>>2]|0)+(c[I>>2]<<2)|0,c[J>>2]|0)|0;c[G>>2]=pe(c[H>>2]|0,c[H>>2]|0,c[I>>2]|0,c[G>>2]|0)|0}}while(0);c[(c[H>>2]|0)+(c[I>>2]<<2)>>2]=c[G>>2];c[v>>2]=(c[I>>2]|0)+1;c[z>>2]=c[H>>2]}c[t>>2]=0;while(1){if((c[t>>2]|0)>=(c[u>>2]|0)){break}c[(c[s>>2]|0)+(c[t>>2]<<2)>>2]=c[n>>2];if((c[v>>2]|0)<=0){if(((c[p>>2]|0)+1|0)!=0){c[o>>2]=c[n>>2];c[q>>2]=(c[p>>2]|0)+1;do{a=c[o>>2]|0;c[o>>2]=a+4;c[a>>2]=0;a=(c[q>>2]|0)+ -1|0;c[q>>2]=a}while((a|0)!=0)}}else{if((c[r>>2]|0)<=(c[v>>2]|0)?(c[t>>2]|0)<((c[u>>2]|0)-1|0):0){G=c[r>>2]|0}else{G=c[v>>2]|0}c[l>>2]=G;c[v>>2]=(c[v>>2]|0)-(c[l>>2]|0);if((c[l>>2]|0)!=0){c[w>>2]=(c[l>>2]|0)-1;c[y>>2]=c[m>>2];c[A>>2]=c[z>>2];a=c[A>>2]|0;c[A>>2]=a+4;c[B>>2]=c[a>>2];if((c[w>>2]|0)!=0){do{b=c[B>>2]|0;a=c[y>>2]|0;c[y>>2]=a+4;c[a>>2]=b;a=c[A>>2]|0;c[A>>2]=a+4;c[B>>2]=c[a>>2];a=(c[w>>2]|0)+ -1|0;c[w>>2]=a}while((a|0)!=0)}b=c[B>>2]|0;a=c[y>>2]|0;c[y>>2]=a+4;c[a>>2]=b}if(((c[p>>2]|0)+1-(c[l>>2]|0)|0)!=0){c[C>>2]=(c[m>>2]|0)+(c[l>>2]<<2);c[D>>2]=(c[p>>2]|0)+1-(c[l>>2]|0);do{a=c[C>>2]|0;c[C>>2]=a+4;c[a>>2]=0;a=(c[D>>2]|0)+ -1|0;c[D>>2]=a}while((a|0)!=0)}c[z>>2]=(c[z>>2]|0)+(c[r>>2]<<2);a=ea(c[t>>2]|0,c[E>>2]|0)|0;Se(c[n>>2]|0,c[m>>2]|0,a,c[p>>2]|0)}c[n>>2]=(c[n>>2]|0)+((c[p>>2]|0)+1<<2);c[t>>2]=(c[t>>2]|0)+1}if(((((c[v>>2]|0)==0^1)&1|0)!=0|0)!=0){Hd(13528,715,13680)}if((((c[x>>2]|0)!=0|0)!=0|0)==0){i=F;return}Od(c[x>>2]|0);i=F;return}function Me(a,b,d,e,f,g,h,j,k,l,m,n,o){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;J=i;i=i+112|0;I=J+100|0;E=J+96|0;L=J+92|0;K=J+88|0;t=J+84|0;F=J+76|0;v=J+72|0;s=J+68|0;M=J+64|0;O=J+60|0;r=J+56|0;N=J+52|0;A=J+48|0;q=J+44|0;x=J+40|0;B=J+36|0;y=J+32|0;u=J+28|0;z=J+24|0;H=J+20|0;G=J+16|0;p=J+12|0;C=J+8|0;D=J+4|0;w=J;c[I>>2]=a;c[E>>2]=b;c[L>>2]=d;c[K>>2]=e;c[t>>2]=f;c[J+80>>2]=g;c[F>>2]=h;c[v>>2]=j;c[s>>2]=k;c[M>>2]=l;c[O>>2]=m;c[r>>2]=n;c[N>>2]=o;c[A>>2]=1<<c[L>>2];Ne(c[K>>2]|0,c[A>>2]|0,(c[O>>2]|0)+(c[L>>2]<<2)|0,c[M>>2]<<1,c[v>>2]|0,1,c[r>>2]|0);if((c[N>>2]|0)==0){Ne(c[t>>2]|0,c[A>>2]|0,(c[O>>2]|0)+(c[L>>2]<<2)|0,c[M>>2]<<1,c[v>>2]|0,1,c[r>>2]|0)}Oe(c[K>>2]|0,(c[N>>2]|0)!=0?c[K>>2]|0:c[t>>2]|0,c[v>>2]|0,c[A>>2]|0);Pe(c[K>>2]|0,c[A>>2]|0,c[M>>2]<<1,c[v>>2]|0,c[r>>2]|0);c[c[t>>2]>>2]=(c[r>>2]|0)+(c[v>>2]<<2)+4;Qe(c[c[t>>2]>>2]|0,c[c[K>>2]>>2]|0,c[L>>2]|0,c[v>>2]|0);c[q>>2]=1;while(1){if((c[q>>2]|0)>=(c[A>>2]|0)){break}c[(c[t>>2]|0)+(c[q>>2]<<2)>>2]=c[(c[K>>2]|0)+((c[q>>2]|0)-1<<2)>>2];a=(c[L>>2]|0)+(ea((c[A>>2]|0)-(c[q>>2]|0)|0,c[M>>2]|0)|0)|0;Qe(c[(c[t>>2]|0)+(c[q>>2]<<2)>>2]|0,c[(c[K>>2]|0)+(c[q>>2]<<2)>>2]|0,a,c[v>>2]|0);c[q>>2]=(c[q>>2]|0)+1}if(((c[v>>2]|0)+1|0)!=0){c[G>>2]=c[r>>2];c[p>>2]=(c[v>>2]|0)+1;do{a=c[G>>2]|0;c[G>>2]=a+4;c[a>>2]=0;a=(c[p>>2]|0)+ -1|0;c[p>>2]=a}while((a|0)!=0)}a=ea(c[s>>2]|0,(c[A>>2]|0)-1|0)|0;c[x>>2]=a+(c[v>>2]|0)+1;c[z>>2]=c[F>>2];if((c[x>>2]|0)!=0){c[C>>2]=c[z>>2];c[D>>2]=c[x>>2];do{a=c[C>>2]|0;c[C>>2]=a+4;c[a>>2]=0;a=(c[D>>2]|0)+ -1|0;c[D>>2]=a}while((a|0)!=0)}c[H>>2]=0;c[q>>2]=(c[A>>2]|0)-1;a=ea(c[s>>2]|0,c[q>>2]|0)|0;c[B>>2]=a+(c[v>>2]|0);c[y>>2]=ea(c[s>>2]|0,c[q>>2]|0)|0;while(1){if((c[q>>2]|0)<0){break}c[w>>2]=(c[z>>2]|0)+(c[y>>2]<<2);c[u>>2]=(c[A>>2]|0)-(c[q>>2]|0)&(c[A>>2]|0)-1;if((qe(c[w>>2]|0,c[w>>2]|0,c[(c[t>>2]|0)+(c[u>>2]<<2)>>2]|0,(c[v>>2]|0)+1|0)|0)!=0){a=pe((c[w>>2]|0)+(c[v>>2]<<2)+4|0,(c[w>>2]|0)+(c[v>>2]<<2)+4|0,(c[x>>2]|0)-(c[y>>2]|0)-(c[v>>2]|0)-1|0,1)|0;c[H>>2]=(c[H>>2]|0)+a}c[(c[r>>2]|0)+(c[s>>2]<<1<<2)>>2]=(c[q>>2]|0)+1;if((ff(c[(c[t>>2]|0)+(c[u>>2]<<2)>>2]|0,c[r>>2]|0,(c[v>>2]|0)+1|0)|0)>0){a=se(c[w>>2]|0,c[w>>2]|0,(c[x>>2]|0)-(c[y>>2]|0)|0,1)|0;c[H>>2]=(c[H>>2]|0)-a;a=se((c[z>>2]|0)+(c[B>>2]<<2)|0,(c[z>>2]|0)+(c[B>>2]<<2)|0,(c[x>>2]|0)-(c[B>>2]|0)|0,1)|0;c[H>>2]=(c[H>>2]|0)-a}c[q>>2]=(c[q>>2]|0)+ -1;c[B>>2]=(c[B>>2]|0)-(c[s>>2]|0);c[y>>2]=(c[y>>2]|0)-(c[s>>2]|0)}if((c[H>>2]|0)==-1){a=pe((c[z>>2]|0)+(c[x>>2]<<2)+(0-(c[E>>2]|0)<<2)|0,(c[z>>2]|0)+(c[x>>2]<<2)+(0-(c[E>>2]|0)<<2)|0,c[E>>2]|0,1)|0;c[H>>2]=a;if((a|0)==0){e=c[I>>2]|0;d=c[E>>2]|0;b=c[z>>2]|0;a=c[x>>2]|0;a=Re(e,d,b,a)|0;i=J;return a|0}se((c[z>>2]|0)+(c[x>>2]<<2)+(0-(c[E>>2]|0)<<2)+ -4|0,(c[z>>2]|0)+(c[x>>2]<<2)+(0-(c[E>>2]|0)<<2)+ -4|0,(c[E>>2]|0)+1|0,1)|0;se((c[z>>2]|0)+(c[x>>2]<<2)+ -4|0,(c[z>>2]|0)+(c[x>>2]<<2)+ -4|0,1,1)|0;e=c[I>>2]|0;d=c[E>>2]|0;b=c[z>>2]|0;a=c[x>>2]|0;a=Re(e,d,b,a)|0;i=J;return a|0}if((c[H>>2]|0)!=1){e=c[I>>2]|0;d=c[E>>2]|0;b=c[z>>2]|0;a=c[x>>2]|0;a=Re(e,d,b,a)|0;i=J;return a|0}if((c[x>>2]|0)>=(c[E>>2]<<1|0)){do{a=pe((c[z>>2]|0)+(c[x>>2]<<2)+(0-(c[E>>2]<<1)<<2)|0,(c[z>>2]|0)+(c[x>>2]<<2)+(0-(c[E>>2]<<1)<<2)|0,c[E>>2]<<1,c[H>>2]|0)|0;c[H>>2]=a}while((a|0)!=0);e=c[I>>2]|0;d=c[E>>2]|0;b=c[z>>2]|0;a=c[x>>2]|0;a=Re(e,d,b,a)|0;i=J;return a|0}else{c[H>>2]=se((c[z>>2]|0)+(c[x>>2]<<2)+(0-(c[E>>2]|0)<<2)|0,(c[z>>2]|0)+(c[x>>2]<<2)+(0-(c[E>>2]|0)<<2)|0,c[E>>2]|0,c[H>>2]|0)|0;e=c[I>>2]|0;d=c[E>>2]|0;b=c[z>>2]|0;a=c[x>>2]|0;a=Re(e,d,b,a)|0;i=J;return a|0}return 0}function Ne(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;t=i;i=i+64|0;p=t+56|0;j=t+52|0;s=t+48|0;n=t+44|0;r=t+40|0;q=t+36|0;o=t+32|0;u=t+28|0;y=t+24|0;w=t+20|0;x=t+16|0;v=t+12|0;k=t+8|0;l=t+4|0;m=t;c[p>>2]=a;c[j>>2]=b;c[s>>2]=d;c[n>>2]=e;c[r>>2]=f;c[q>>2]=g;c[o>>2]=h;if((c[j>>2]|0)!=2){c[l>>2]=c[j>>2]>>1;c[m>>2]=c[c[s>>2]>>2];Ne(c[p>>2]|0,c[l>>2]|0,(c[s>>2]|0)+ -4|0,c[n>>2]<<1,c[r>>2]|0,c[q>>2]<<1,c[o>>2]|0);Ne((c[p>>2]|0)+(c[q>>2]<<2)|0,c[l>>2]|0,(c[s>>2]|0)+ -4|0,c[n>>2]<<1,c[r>>2]|0,c[q>>2]<<1,c[o>>2]|0);c[k>>2]=0;while(1){if((c[k>>2]|0)>=(c[l>>2]|0)){break}a=ea(c[c[m>>2]>>2]|0,c[n>>2]|0)|0;Se(c[o>>2]|0,c[(c[p>>2]|0)+(c[q>>2]<<2)>>2]|0,a,c[r>>2]|0);Ue(c[(c[p>>2]|0)+(c[q>>2]<<2)>>2]|0,c[c[p>>2]>>2]|0,c[o>>2]|0,c[r>>2]|0);Ve(c[c[p>>2]>>2]|0,c[c[p>>2]>>2]|0,c[o>>2]|0,c[r>>2]|0);c[k>>2]=(c[k>>2]|0)+1;c[m>>2]=(c[m>>2]|0)+8;c[p>>2]=(c[p>>2]|0)+(c[q>>2]<<1<<2)}i=t;return}if(((c[r>>2]|0)+1|0)!=0){c[y>>2]=(c[r>>2]|0)+1-1;c[w>>2]=c[o>>2];c[x>>2]=c[c[p>>2]>>2];a=c[x>>2]|0;c[x>>2]=a+4;c[v>>2]=c[a>>2];if((c[y>>2]|0)!=0){do{b=c[v>>2]|0;a=c[w>>2]|0;c[w>>2]=a+4;c[a>>2]=b;a=c[x>>2]|0;c[x>>2]=a+4;c[v>>2]=c[a>>2];a=(c[y>>2]|0)+ -1|0;c[y>>2]=a}while((a|0)!=0)}b=c[v>>2]|0;a=c[w>>2]|0;c[w>>2]=a+4;c[a>>2]=b}qe(c[c[p>>2]>>2]|0,c[c[p>>2]>>2]|0,c[(c[p>>2]|0)+(c[q>>2]<<2)>>2]|0,(c[r>>2]|0)+1|0)|0;c[u>>2]=te(c[(c[p>>2]|0)+(c[q>>2]<<2)>>2]|0,c[o>>2]|0,c[(c[p>>2]|0)+(c[q>>2]<<2)>>2]|0,(c[r>>2]|0)+1|0)|0;if((c[(c[c[p>>2]>>2]|0)+(c[r>>2]<<2)>>2]|0)>>>0>1){a=1-(se(c[c[p>>2]>>2]|0,c[c[p>>2]>>2]|0,c[r>>2]|0,(c[(c[c[p>>2]>>2]|0)+(c[r>>2]<<2)>>2]|0)-1|0)|0)|0;c[(c[c[p>>2]>>2]|0)+(c[r>>2]<<2)>>2]=a}if((c[u>>2]|0)==0){i=t;return}a=pe(c[(c[p>>2]|0)+(c[q>>2]<<2)>>2]|0,c[(c[p>>2]|0)+(c[q>>2]<<2)>>2]|0,c[r>>2]|0,~c[(c[(c[p>>2]|0)+(c[q>>2]<<2)>>2]|0)+(c[r>>2]<<2)>>2]+1|0)|0;c[(c[(c[p>>2]|0)+(c[q>>2]<<2)>>2]|0)+(c[r>>2]<<2)>>2]=a;i=t;return}function Oe(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;o=i;i=i+128|0;n=o+116|0;j=o+112|0;k=o+108|0;m=o+104|0;l=o+100|0;h=o+96|0;f=o+92|0;H=o+88|0;I=o+84|0;x=o+80|0;D=o+76|0;C=o+72|0;u=o+68|0;E=o+64|0;y=o+60|0;K=o+56|0;w=o+52|0;G=o+48|0;J=o+44|0;v=o+40|0;z=o+36|0;F=o+32|0;A=o+28|0;B=o+24|0;t=o+20|0;g=o+16|0;p=o+12|0;s=o+8|0;r=o+4|0;q=o;c[n>>2]=a;c[j>>2]=b;c[k>>2]=d;c[m>>2]=e;c[h>>2]=(c[n>>2]|0)==(c[j>>2]|0);c[f>>2]=0;e=c[k>>2]|0;a:do{if((c[k>>2]|0)>=(((c[h>>2]|0)!=0?360:300)|0)){c[y>>2]=Ge(e,c[h>>2]|0)|0;c[H>>2]=1<<c[y>>2];if(((((c[k>>2]&(c[H>>2]|0)-1|0)==0^1)&1|0)!=0|0)!=0){Hd(13528,449,13640)}c[C>>2]=(c[H>>2]|0)>32?c[H>>2]|0:32;c[D>>2]=c[k>>2]<<5>>c[y>>2];c[u>>2]=c[k>>2]>>c[y>>2];c[x>>2]=ea(((c[D>>2]<<1)+(c[y>>2]|0)+2+(c[C>>2]|0)|0)/(c[C>>2]|0)|0,c[C>>2]|0)|0;c[I>>2]=(c[x>>2]|0)/32|0;b:do{if((c[I>>2]|0)>=(((c[h>>2]|0)!=0?360:300)|0)){while(1){c[A>>2]=1<<(Ge(c[I>>2]|0,c[h>>2]|0)|0);if((c[I>>2]&(c[A>>2]|0)-1|0)==0){break b}c[I>>2]=(c[I>>2]|0)+(c[A>>2]|0)-1&0-(c[A>>2]|0);c[x>>2]=c[I>>2]<<5}}}while(0);if(((((c[I>>2]|0)<(c[k>>2]|0)^1)&1|0)!=0|0)!=0){Hd(13528,471,13664)}c[E>>2]=c[x>>2]>>c[y>>2];c[G>>2]=Nd(f,c[H>>2]<<2)|0;c[J>>2]=Nd(f,c[H>>2]<<2)|0;c[v>>2]=Nd(f,(c[I>>2]|0)+1<<1<<c[y>>2]<<2)|0;c[F>>2]=Nd(f,(c[I>>2]|0)+1<<1<<2)|0;c[z>>2]=(c[v>>2]|0)+((c[I>>2]|0)+1<<c[y>>2]<<2);c[K>>2]=Nd(f,(c[y>>2]|0)+1<<2)|0;c[w>>2]=Nd(f,2<<c[y>>2]<<2)|0;c[l>>2]=0;while(1){if((c[l>>2]|0)>(c[y>>2]|0)){break}c[(c[K>>2]|0)+(c[l>>2]<<2)>>2]=c[w>>2];c[w>>2]=(c[w>>2]|0)+(1<<c[l>>2]<<2);c[l>>2]=(c[l>>2]|0)+1}Je(c[K>>2]|0,c[y>>2]|0);c[l>>2]=0;while(1){if((c[l>>2]|0)>=(c[m>>2]|0)){break a}Te(c[c[n>>2]>>2]|0,c[k>>2]|0);if((c[h>>2]|0)==0){Te(c[c[j>>2]>>2]|0,c[k>>2]|0)}Le(c[v>>2]|0,c[G>>2]|0,c[H>>2]|0,c[I>>2]|0,c[c[n>>2]>>2]|0,(c[u>>2]<<c[y>>2])+1|0,c[u>>2]|0,c[E>>2]|0,c[F>>2]|0);if((c[h>>2]|0)==0){Le(c[z>>2]|0,c[J>>2]|0,c[H>>2]|0,c[I>>2]|0,c[c[j>>2]>>2]|0,(c[u>>2]<<c[y>>2])+1|0,c[u>>2]|0,c[E>>2]|0,c[F>>2]|0)}c[B>>2]=Me(c[c[n>>2]>>2]|0,c[k>>2]|0,c[y>>2]|0,c[G>>2]|0,c[J>>2]|0,c[v>>2]|0,c[z>>2]|0,c[I>>2]|0,c[u>>2]|0,c[E>>2]|0,c[K>>2]|0,c[F>>2]|0,c[h>>2]|0)|0;c[(c[c[n>>2]>>2]|0)+(c[k>>2]<<2)>>2]=c[B>>2];c[l>>2]=(c[l>>2]|0)+1;c[n>>2]=(c[n>>2]|0)+4;c[j>>2]=(c[j>>2]|0)+4}}else{c[q>>2]=e<<1;c[p>>2]=Nd(f,c[q>>2]<<2)|0;c[s>>2]=(c[p>>2]|0)+(c[k>>2]<<2);c[l>>2]=0;while(1){if((c[l>>2]|0)>=(c[m>>2]|0)){break a}u=c[n>>2]|0;c[n>>2]=u+4;c[t>>2]=c[u>>2];u=c[j>>2]|0;c[j>>2]=u+4;c[g>>2]=c[u>>2];u=c[p>>2]|0;if((c[h>>2]|0)!=0){Xe(u,c[t>>2]|0,c[k>>2]|0)}else{We(u,c[g>>2]|0,c[t>>2]|0,c[k>>2]|0)}if((c[(c[t>>2]|0)+(c[k>>2]<<2)>>2]|0)!=0){c[r>>2]=qe(c[s>>2]|0,c[s>>2]|0,c[g>>2]|0,c[k>>2]|0)|0}else{c[r>>2]=0}if((c[(c[g>>2]|0)+(c[k>>2]<<2)>>2]|0)!=0){a=qe(c[s>>2]|0,c[s>>2]|0,c[t>>2]|0,c[k>>2]|0)|0;c[r>>2]=(c[r>>2]|0)+(a+(c[(c[t>>2]|0)+(c[k>>2]<<2)>>2]|0))}if((c[r>>2]|0)!=0){c[r>>2]=pe(c[p>>2]|0,c[p>>2]|0,c[q>>2]|0,c[r>>2]|0)|0}if((te(c[t>>2]|0,c[p>>2]|0,c[s>>2]|0,c[k>>2]|0)|0)!=0){u=(pe(c[t>>2]|0,c[t>>2]|0,c[k>>2]|0,1)|0)!=0}else{u=0}c[(c[t>>2]|0)+(c[k>>2]<<2)>>2]=u&1;c[l>>2]=(c[l>>2]|0)+1}}}while(0);if((((c[f>>2]|0)!=0|0)!=0|0)==0){i=o;return}Od(c[f>>2]|0);i=o;return}function Pe(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;p=i;i=i+48|0;m=p+44|0;o=p+40|0;k=p+36|0;n=p+32|0;l=p+28|0;g=p+24|0;t=p+20|0;r=p+16|0;s=p+12|0;q=p+8|0;h=p+4|0;j=p;c[m>>2]=a;c[o>>2]=b;c[k>>2]=d;c[n>>2]=e;c[l>>2]=f;if((c[o>>2]|0)!=2){c[j>>2]=c[o>>2]>>1;Pe(c[m>>2]|0,c[j>>2]|0,c[k>>2]<<1,c[n>>2]|0,c[l>>2]|0);Pe((c[m>>2]|0)+(c[j>>2]<<2)|0,c[j>>2]|0,c[k>>2]<<1,c[n>>2]|0,c[l>>2]|0);c[h>>2]=0;while(1){if((c[h>>2]|0)>=(c[j>>2]|0)){break}a=ea(c[h>>2]|0,c[k>>2]|0)|0;Se(c[l>>2]|0,c[(c[m>>2]|0)+(c[j>>2]<<2)>>2]|0,a,c[n>>2]|0);Ue(c[(c[m>>2]|0)+(c[j>>2]<<2)>>2]|0,c[c[m>>2]>>2]|0,c[l>>2]|0,c[n>>2]|0);Ve(c[c[m>>2]>>2]|0,c[c[m>>2]>>2]|0,c[l>>2]|0,c[n>>2]|0);c[h>>2]=(c[h>>2]|0)+1;c[m>>2]=(c[m>>2]|0)+4}i=p;return}if(((c[n>>2]|0)+1|0)!=0){c[t>>2]=(c[n>>2]|0)+1-1;c[r>>2]=c[l>>2];c[s>>2]=c[c[m>>2]>>2];a=c[s>>2]|0;c[s>>2]=a+4;c[q>>2]=c[a>>2];if((c[t>>2]|0)!=0){do{b=c[q>>2]|0;a=c[r>>2]|0;c[r>>2]=a+4;c[a>>2]=b;a=c[s>>2]|0;c[s>>2]=a+4;c[q>>2]=c[a>>2];a=(c[t>>2]|0)+ -1|0;c[t>>2]=a}while((a|0)!=0)}b=c[q>>2]|0;a=c[r>>2]|0;c[r>>2]=a+4;c[a>>2]=b}qe(c[c[m>>2]>>2]|0,c[c[m>>2]>>2]|0,c[(c[m>>2]|0)+4>>2]|0,(c[n>>2]|0)+1|0)|0;c[g>>2]=te(c[(c[m>>2]|0)+4>>2]|0,c[l>>2]|0,c[(c[m>>2]|0)+4>>2]|0,(c[n>>2]|0)+1|0)|0;if((c[(c[c[m>>2]>>2]|0)+(c[n>>2]<<2)>>2]|0)>>>0>1){a=1-(se(c[c[m>>2]>>2]|0,c[c[m>>2]>>2]|0,c[n>>2]|0,(c[(c[c[m>>2]>>2]|0)+(c[n>>2]<<2)>>2]|0)-1|0)|0)|0;c[(c[c[m>>2]>>2]|0)+(c[n>>2]<<2)>>2]=a}if((c[g>>2]|0)==0){i=p;return}a=pe(c[(c[m>>2]|0)+4>>2]|0,c[(c[m>>2]|0)+4>>2]|0,c[n>>2]|0,~c[(c[(c[m>>2]|0)+4>>2]|0)+(c[n>>2]<<2)>>2]+1|0)|0;c[(c[(c[m>>2]|0)+4>>2]|0)+(c[n>>2]<<2)>>2]=a;i=p;return}function Qe(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+32|0;h=f+16|0;k=f+12|0;l=f+8|0;g=f+4|0;j=f;c[h>>2]=a;c[k>>2]=b;c[l>>2]=d;c[g>>2]=e;c[j>>2]=(c[g>>2]<<1<<5)-(c[l>>2]|0);Se(c[h>>2]|0,c[k>>2]|0,c[j>>2]|0,c[g>>2]|0);Te(c[h>>2]|0,c[g>>2]|0);i=f;return}function Re(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=i;i=i+48|0;h=g+44|0;j=g+40|0;k=g+36|0;s=g+32|0;l=g+28|0;f=g+24|0;n=g+20|0;m=g+16|0;r=g+12|0;p=g+8|0;q=g+4|0;o=g;c[h>>2]=a;c[j>>2]=b;c[k>>2]=d;c[s>>2]=e;c[f>>2]=(c[s>>2]|0)-(c[j>>2]<<1);if((c[f>>2]|0)>0){c[l>>2]=c[j>>2];c[m>>2]=qe(c[h>>2]|0,c[k>>2]|0,(c[k>>2]|0)+(c[j>>2]<<1<<2)|0,c[f>>2]|0)|0;c[n>>2]=pe((c[h>>2]|0)+(c[f>>2]<<2)|0,(c[k>>2]|0)+(c[f>>2]<<2)|0,(c[j>>2]|0)-(c[f>>2]|0)|0,c[m>>2]|0)|0}else{c[l>>2]=(c[s>>2]|0)-(c[j>>2]|0);if((c[j>>2]|0)!=0){c[r>>2]=(c[j>>2]|0)-1;c[p>>2]=c[h>>2];c[q>>2]=c[k>>2];a=c[q>>2]|0;c[q>>2]=a+4;c[o>>2]=c[a>>2];if((c[r>>2]|0)!=0){do{b=c[o>>2]|0;a=c[p>>2]|0;c[p>>2]=a+4;c[a>>2]=b;a=c[q>>2]|0;c[q>>2]=a+4;c[o>>2]=c[a>>2];a=(c[r>>2]|0)+ -1|0;c[r>>2]=a}while((a|0)!=0)}b=c[o>>2]|0;a=c[p>>2]|0;c[p>>2]=a+4;c[a>>2]=b}c[n>>2]=0}c[m>>2]=te(c[h>>2]|0,c[h>>2]|0,(c[k>>2]|0)+(c[j>>2]<<2)|0,c[l>>2]|0)|0;a=se((c[h>>2]|0)+(c[l>>2]<<2)|0,(c[h>>2]|0)+(c[l>>2]<<2)|0,(c[j>>2]|0)-(c[l>>2]|0)|0,c[m>>2]|0)|0;c[n>>2]=(c[n>>2]|0)-a;if((c[n>>2]|0)>=0){a=c[n>>2]|0;i=g;return a|0}c[n>>2]=pe(c[h>>2]|0,c[h>>2]|0,c[j>>2]|0,1)|0;a=c[n>>2]|0;i=g;return a|0}function Se(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;k=i;i=i+112|0;o=k+100|0;m=k+96|0;G=k+92|0;l=k+88|0;n=k+84|0;h=k+80|0;f=k+76|0;j=k+72|0;z=k+68|0;x=k+64|0;y=k+60|0;w=k+56|0;F=k+52|0;E=k+48|0;v=k+44|0;B=k+40|0;D=k+36|0;C=k+32|0;A=k+28|0;u=k+24|0;t=k+20|0;g=k+16|0;s=k+12|0;q=k+8|0;r=k+4|0;p=k;c[o>>2]=a;c[m>>2]=b;c[G>>2]=d;c[l>>2]=e;c[n>>2]=((c[G>>2]|0)>>>0)%32|0;c[h>>2]=((c[G>>2]|0)>>>0)/32|0;if((c[h>>2]|0)>=(c[l>>2]|0)){c[h>>2]=(c[h>>2]|0)-(c[l>>2]|0);if((c[n>>2]|0)!=0){xe(c[o>>2]|0,(c[m>>2]|0)+(c[l>>2]<<2)+(0-(c[h>>2]|0)<<2)|0,(c[h>>2]|0)+1|0,c[n>>2]|0)|0;c[j>>2]=c[(c[o>>2]|0)+(c[h>>2]<<2)>>2];c[f>>2]=Ce((c[o>>2]|0)+(c[h>>2]<<2)|0,c[m>>2]|0,(c[l>>2]|0)-(c[h>>2]|0)|0,c[n>>2]|0)|0}else{if((c[h>>2]|0)!=0){c[z>>2]=(c[h>>2]|0)-1;c[x>>2]=c[o>>2];c[y>>2]=(c[m>>2]|0)+(c[l>>2]<<2)+(0-(c[h>>2]|0)<<2);G=c[y>>2]|0;c[y>>2]=G+4;c[w>>2]=c[G>>2];if((c[z>>2]|0)!=0){do{a=c[w>>2]|0;G=c[x>>2]|0;c[x>>2]=G+4;c[G>>2]=a;G=c[y>>2]|0;c[y>>2]=G+4;c[w>>2]=c[G>>2];G=(c[z>>2]|0)+ -1|0;c[z>>2]=G}while((G|0)!=0)}a=c[w>>2]|0;G=c[x>>2]|0;c[x>>2]=G+4;c[G>>2]=a}c[j>>2]=c[(c[m>>2]|0)+(c[l>>2]<<2)>>2];c[F>>2]=(c[o>>2]|0)+(c[h>>2]<<2);c[E>>2]=c[m>>2];c[v>>2]=(c[l>>2]|0)-(c[h>>2]|0);do{a=c[E>>2]|0;c[E>>2]=a+4;a=~c[a>>2];G=c[F>>2]|0;c[F>>2]=G+4;c[G>>2]=a;G=(c[v>>2]|0)+ -1|0;c[v>>2]=G}while((G|0)!=0);c[f>>2]=0}c[(c[o>>2]|0)+(c[l>>2]<<2)>>2]=0;c[f>>2]=(c[f>>2]|0)+1;c[D>>2]=c[o>>2];c[B>>2]=(c[c[D>>2]>>2]|0)+(c[f>>2]|0);c[c[D>>2]>>2]=c[B>>2];if((c[B>>2]|0)>>>0<(c[f>>2]|0)>>>0){do{a=(c[D>>2]|0)+4|0;c[D>>2]=a;G=(c[a>>2]|0)+1|0;c[a>>2]=G}while((G|0)==0)}c[j>>2]=(c[j>>2]|0)+1;c[f>>2]=(c[j>>2]|0)==0?1:c[j>>2]|0;c[o>>2]=(c[o>>2]|0)+(c[h>>2]<<2)+(((c[j>>2]|0)==0)<<2);c[A>>2]=c[o>>2];c[C>>2]=(c[c[A>>2]>>2]|0)+(c[f>>2]|0);c[c[A>>2]>>2]=c[C>>2];if(!((c[C>>2]|0)>>>0<(c[f>>2]|0)>>>0)){i=k;return}do{a=(c[A>>2]|0)+4|0;c[A>>2]=a;G=(c[a>>2]|0)+1|0;c[a>>2]=G}while((G|0)==0);i=k;return}v=c[o>>2]|0;if((c[n>>2]|0)!=0){Ce(v,(c[m>>2]|0)+(c[l>>2]<<2)+(0-(c[h>>2]|0)<<2)|0,(c[h>>2]|0)+1|0,c[n>>2]|0)|0;c[j>>2]=~c[(c[o>>2]|0)+(c[h>>2]<<2)>>2];c[f>>2]=xe((c[o>>2]|0)+(c[h>>2]<<2)|0,c[m>>2]|0,(c[l>>2]|0)-(c[h>>2]|0)|0,c[n>>2]|0)|0}else{c[u>>2]=v;c[t>>2]=(c[m>>2]|0)+(c[l>>2]<<2)+(0-(c[h>>2]|0)<<2);c[g>>2]=(c[h>>2]|0)+1;do{a=c[t>>2]|0;c[t>>2]=a+4;a=~c[a>>2];G=c[u>>2]|0;c[u>>2]=G+4;c[G>>2]=a;G=(c[g>>2]|0)+ -1|0;c[g>>2]=G}while((G|0)!=0);c[j>>2]=c[(c[m>>2]|0)+(c[l>>2]<<2)>>2];if(((c[l>>2]|0)-(c[h>>2]|0)|0)!=0){c[s>>2]=(c[l>>2]|0)-(c[h>>2]|0)-1;c[q>>2]=(c[o>>2]|0)+(c[h>>2]<<2);c[r>>2]=c[m>>2];G=c[r>>2]|0;c[r>>2]=G+4;c[p>>2]=c[G>>2];if((c[s>>2]|0)!=0){do{a=c[p>>2]|0;G=c[q>>2]|0;c[q>>2]=G+4;c[G>>2]=a;G=c[r>>2]|0;c[r>>2]=G+4;c[p>>2]=c[G>>2];G=(c[s>>2]|0)+ -1|0;c[s>>2]=G}while((G|0)!=0)}a=c[p>>2]|0;G=c[q>>2]|0;c[q>>2]=G+4;c[G>>2]=a}c[f>>2]=0}if((c[h>>2]|0)!=0){G=c[f>>2]|0;c[f>>2]=G+ -1;if((G|0)==0){c[f>>2]=pe(c[o>>2]|0,c[o>>2]|0,c[l>>2]|0,1)|0}c[f>>2]=(se(c[o>>2]|0,c[o>>2]|0,c[h>>2]|0,c[f>>2]|0)|0)+1}a=0-(se((c[o>>2]|0)+(c[h>>2]<<2)|0,(c[o>>2]|0)+(c[h>>2]<<2)|0,(c[l>>2]|0)-(c[h>>2]|0)|0,c[f>>2]|0)|0)|0;c[(c[o>>2]|0)+(c[l>>2]<<2)>>2]=a;a=se((c[o>>2]|0)+(c[h>>2]<<2)|0,(c[o>>2]|0)+(c[h>>2]<<2)|0,(c[l>>2]|0)-(c[h>>2]|0)|0,c[j>>2]|0)|0;G=(c[o>>2]|0)+(c[l>>2]<<2)|0;c[G>>2]=(c[G>>2]|0)-a;if((c[(c[o>>2]|0)+(c[l>>2]<<2)>>2]&-2147483648|0)==0){i=k;return}G=pe(c[o>>2]|0,c[o>>2]|0,c[l>>2]|0,1)|0;c[(c[o>>2]|0)+(c[l>>2]<<2)>>2]=G;i=k;return}function Te(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+32|0;e=d+16|0;g=d+12|0;j=d+8|0;f=d+4|0;h=d;c[e>>2]=a;c[g>>2]=b;if((c[(c[e>>2]|0)+(c[g>>2]<<2)>>2]|0)==0){i=d;return}c[j>>2]=c[e>>2];do{b=c[j>>2]|0;c[j>>2]=b+4;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0);b=c[g>>2]|0;if((c[(c[e>>2]|0)+(c[g>>2]<<2)>>2]|0)!=0){c[(c[e>>2]|0)+(b<<2)>>2]=0;i=d;return}if((b|0)!=0){c[f>>2]=c[e>>2];c[h>>2]=c[g>>2];do{a=c[f>>2]|0;c[f>>2]=a+4;c[a>>2]=0;a=(c[h>>2]|0)+ -1|0;c[h>>2]=a}while((a|0)!=0)}c[(c[e>>2]|0)+(c[g>>2]<<2)>>2]=1;i=d;return}function Ue(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+32|0;k=f+28|0;o=f+24|0;n=f+20|0;l=f+16|0;m=f+12|0;h=f+8|0;j=f+4|0;g=f;c[k>>2]=a;c[o>>2]=b;c[n>>2]=d;c[l>>2]=e;a=(c[(c[o>>2]|0)+(c[l>>2]<<2)>>2]|0)-(c[(c[n>>2]|0)+(c[l>>2]<<2)>>2]|0)|0;c[m>>2]=a-(te(c[k>>2]|0,c[o>>2]|0,c[n>>2]|0,c[l>>2]|0)|0);c[h>>2]=0-(c[m>>2]|0)&0-((c[m>>2]&-2147483648|0)!=0);c[(c[k>>2]|0)+(c[l>>2]<<2)>>2]=(c[h>>2]|0)+(c[m>>2]|0);c[g>>2]=c[k>>2];c[j>>2]=(c[c[g>>2]>>2]|0)+(c[h>>2]|0);c[c[g>>2]>>2]=c[j>>2];if(!((c[j>>2]|0)>>>0<(c[h>>2]|0)>>>0)){i=f;return}do{n=(c[g>>2]|0)+4|0;c[g>>2]=n;o=(c[n>>2]|0)+1|0;c[n>>2]=o}while((o|0)==0);i=f;return}function Ve(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+32|0;k=f+28|0;o=f+24|0;n=f+20|0;l=f+16|0;m=f+12|0;h=f+8|0;j=f+4|0;g=f;c[k>>2]=a;c[o>>2]=b;c[n>>2]=d;c[l>>2]=e;a=(c[(c[o>>2]|0)+(c[l>>2]<<2)>>2]|0)+(c[(c[n>>2]|0)+(c[l>>2]<<2)>>2]|0)|0;c[m>>2]=a+(qe(c[k>>2]|0,c[o>>2]|0,c[n>>2]|0,c[l>>2]|0)|0);c[h>>2]=(c[m>>2]|0)-1&0-((c[m>>2]|0)!=0);c[(c[k>>2]|0)+(c[l>>2]<<2)>>2]=(c[m>>2]|0)-(c[h>>2]|0);c[g>>2]=c[k>>2];c[j>>2]=c[c[g>>2]>>2];c[c[g>>2]>>2]=(c[j>>2]|0)-(c[h>>2]|0);if(!((c[j>>2]|0)>>>0<(c[h>>2]|0)>>>0)){i=f;return}do{n=(c[g>>2]|0)+4|0;c[g>>2]=n;o=c[n>>2]|0;c[n>>2]=o+ -1}while((o|0)==0);i=f;return}function We(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;l=i;i=i+1088|0;k=l+1084|0;j=l+1080|0;h=l+1076|0;g=l+1072|0;p=l+16|0;o=l+12|0;n=l+8|0;f=l+4|0;m=l;c[k>>2]=a;c[j>>2]=b;c[h>>2]=d;c[g>>2]=e;if((c[g>>2]|0)<30){Ye(c[k>>2]|0,c[j>>2]|0,c[g>>2]|0,c[h>>2]|0,c[g>>2]|0);i=l;return}if((c[g>>2]|0)<100){hf(c[k>>2]|0,c[j>>2]|0,c[g>>2]|0,c[h>>2]|0,c[g>>2]|0,l+24|0);i=l;return}e=c[g>>2]|0;if((c[g>>2]|0)<300){a=i;i=i+((1*((e*3|0)+32<<2)|0)+15&-16)|0;c[p>>2]=a;qf(c[k>>2]|0,c[j>>2]|0,c[g>>2]|0,c[h>>2]|0,c[g>>2]|0,c[p>>2]|0);i=l;return}p=c[g>>2]|0;if((e|0)<350){a=i;i=i+((1*((p*3|0)+32<<2)|0)+15&-16)|0;c[o>>2]=a;wf(c[k>>2]|0,c[j>>2]|0,c[g>>2]|0,c[h>>2]|0,c[g>>2]|0,c[o>>2]|0);i=l;return}o=c[g>>2]|0;if((p|0)<450){a=i;i=i+((1*((o-350<<1)+1082<<2)|0)+15&-16)|0;c[n>>2]=a;xf(c[k>>2]|0,c[j>>2]|0,c[g>>2]|0,c[h>>2]|0,c[g>>2]|0,c[n>>2]|0);i=l;return}if((o|0)>=3e3){_e(c[k>>2]|0,c[j>>2]|0,c[g>>2]|0,c[h>>2]|0,c[g>>2]|0);i=l;return}c[m>>2]=0;n=((c[g>>2]|0)*15>>3)-843+1282<<2;if(((((c[g>>2]|0)*15>>3)-843+1282<<2>>>0<65536|0)!=0|0)!=0){a=i;i=i+((1*n|0)+15&-16)|0;n=a}else{n=Nd(m,n)|0}c[f>>2]=n;zf(c[k>>2]|0,c[j>>2]|0,c[g>>2]|0,c[h>>2]|0,c[g>>2]|0,c[f>>2]|0);if((((c[m>>2]|0)!=0|0)!=0|0)==0){i=l;return}Od(c[m>>2]|0);i=l;return}function Xe(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;j=i;i=i+1248|0;h=j+1240|0;g=j+1236|0;f=j+1232|0;n=j+16|0;m=j+12|0;l=j+8|0;e=j+4|0;k=j;c[h>>2]=a;c[g>>2]=b;c[f>>2]=d;if((c[f>>2]|0)<50){Ze(c[h>>2]|0,c[g>>2]|0,c[f>>2]|0);i=j;return}if((c[f>>2]|0)<120){Cf(c[h>>2]|0,c[g>>2]|0,c[f>>2]|0,j+24|0);i=j;return}d=c[f>>2]|0;if((c[f>>2]|0)<400){a=i;i=i+((1*((d*3|0)+32<<2)|0)+15&-16)|0;c[n>>2]=a;Ef(c[h>>2]|0,c[g>>2]|0,c[f>>2]|0,c[n>>2]|0);i=j;return}n=c[f>>2]|0;if((d|0)<350){a=i;i=i+((1*((n*3|0)+32<<2)|0)+15&-16)|0;c[m>>2]=a;Ff(c[h>>2]|0,c[g>>2]|0,c[f>>2]|0,c[m>>2]|0);i=j;return}m=c[f>>2]|0;if((n|0)<450){a=i;i=i+((1*((m-350<<1)+1082<<2)|0)+15&-16)|0;c[l>>2]=a;yf(c[h>>2]|0,c[g>>2]|0,c[f>>2]|0,c[l>>2]|0);i=j;return}if((m|0)>=3600){_e(c[h>>2]|0,c[g>>2]|0,c[f>>2]|0,c[g>>2]|0,c[f>>2]|0);i=j;return}c[k>>2]=0;l=((c[f>>2]|0)*15>>3)-843+1282<<2;if(((((c[f>>2]|0)*15>>3)-843+1282<<2>>>0<65536|0)!=0|0)!=0){a=i;i=i+((1*l|0)+15&-16)|0;l=a}else{l=Nd(k,l)|0}c[e>>2]=l;Af(c[h>>2]|0,c[g>>2]|0,c[f>>2]|0,c[e>>2]|0);if((((c[k>>2]|0)!=0|0)!=0|0)==0){i=j;return}Od(c[k>>2]|0);i=j;return}function Ye(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;l=i;i=i+32|0;j=l+16|0;k=l+12|0;g=l+8|0;m=l+4|0;h=l;c[j>>2]=a;c[k>>2]=b;c[g>>2]=d;c[m>>2]=e;c[h>>2]=f;a=ue(c[j>>2]|0,c[k>>2]|0,c[g>>2]|0,c[c[m>>2]>>2]|0)|0;c[(c[j>>2]|0)+(c[g>>2]<<2)>>2]=a;c[j>>2]=(c[j>>2]|0)+4;c[m>>2]=(c[m>>2]|0)+4;c[h>>2]=(c[h>>2]|0)-1;while(1){if((c[h>>2]|0)<1){break}a=ve(c[j>>2]|0,c[k>>2]|0,c[g>>2]|0,c[c[m>>2]>>2]|0)|0;c[(c[j>>2]|0)+(c[g>>2]<<2)>>2]=a;c[j>>2]=(c[j>>2]|0)+4;c[m>>2]=(c[m>>2]|0)+4;c[h>>2]=(c[h>>2]|0)-1}i=l;return}function Ze(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;s=i;i=i+544|0;j=s+532|0;k=s+528|0;g=s+524|0;y=s+520|0;M=s+516|0;E=s+512|0;D=s+508|0;C=s+504|0;F=s+500|0;B=s+496|0;J=s+492|0;I=s+488|0;H=s+484|0;G=s+480|0;L=s+476|0;K=s+472|0;f=s+64|0;A=s+60|0;z=s+56|0;h=s+52|0;l=s+48|0;m=s+44|0;x=s+40|0;t=s+36|0;u=s+32|0;v=s+28|0;w=s+24|0;p=s+20|0;r=s+16|0;q=s+12|0;e=s+8|0;n=s+4|0;o=s;c[j>>2]=a;c[k>>2]=b;c[g>>2]=d;c[M>>2]=c[c[k>>2]>>2];c[L>>2]=c[M>>2];c[K>>2]=c[M>>2]<<0;c[J>>2]=c[L>>2]&65535;c[H>>2]=(c[L>>2]|0)>>>16;c[I>>2]=c[K>>2]&65535;c[G>>2]=(c[K>>2]|0)>>>16;c[D>>2]=ea(c[J>>2]|0,c[I>>2]|0)|0;c[C>>2]=ea(c[J>>2]|0,c[G>>2]|0)|0;c[F>>2]=ea(c[H>>2]|0,c[I>>2]|0)|0;c[B>>2]=ea(c[H>>2]|0,c[G>>2]|0)|0;c[C>>2]=(c[C>>2]|0)+((c[D>>2]|0)>>>16);c[C>>2]=(c[C>>2]|0)+(c[F>>2]|0);if((c[C>>2]|0)>>>0<(c[F>>2]|0)>>>0){c[B>>2]=(c[B>>2]|0)+65536}c[(c[j>>2]|0)+4>>2]=(c[B>>2]|0)+((c[C>>2]|0)>>>16);c[E>>2]=(c[C>>2]<<16)+(c[D>>2]&65535);c[c[j>>2]>>2]=(c[E>>2]|0)>>>0;if((c[g>>2]|0)<=1){i=s;return}c[f>>2]=s+72;c[A>>2]=ue(c[f>>2]|0,(c[k>>2]|0)+4|0,(c[g>>2]|0)-1|0,c[c[k>>2]>>2]|0)|0;c[(c[f>>2]|0)+((c[g>>2]|0)-1<<2)>>2]=c[A>>2];c[y>>2]=2;while(1){if((c[y>>2]|0)>=(c[g>>2]|0)){break}c[z>>2]=ve((c[f>>2]|0)+(c[y>>2]<<1<<2)+ -8|0,(c[k>>2]|0)+(c[y>>2]<<2)|0,(c[g>>2]|0)-(c[y>>2]|0)|0,c[(c[k>>2]|0)+((c[y>>2]|0)-1<<2)>>2]|0)|0;c[(c[f>>2]|0)+((c[g>>2]|0)+(c[y>>2]|0)-2<<2)>>2]=c[z>>2];c[y>>2]=(c[y>>2]|0)+1}c[l>>2]=0;while(1){if((c[l>>2]|0)>=(c[g>>2]|0)){break}c[m>>2]=c[(c[k>>2]|0)+(c[l>>2]<<2)>>2];c[n>>2]=c[m>>2];c[o>>2]=c[m>>2]<<0;c[p>>2]=c[n>>2]&65535;c[q>>2]=(c[n>>2]|0)>>>16;c[r>>2]=c[o>>2]&65535;c[e>>2]=(c[o>>2]|0)>>>16;c[t>>2]=ea(c[p>>2]|0,c[r>>2]|0)|0;c[u>>2]=ea(c[p>>2]|0,c[e>>2]|0)|0;c[v>>2]=ea(c[q>>2]|0,c[r>>2]|0)|0;c[w>>2]=ea(c[q>>2]|0,c[e>>2]|0)|0;c[u>>2]=(c[u>>2]|0)+((c[t>>2]|0)>>>16);c[u>>2]=(c[u>>2]|0)+(c[v>>2]|0);if((c[u>>2]|0)>>>0<(c[v>>2]|0)>>>0){c[w>>2]=(c[w>>2]|0)+65536}c[(c[j>>2]|0)+((c[l>>2]<<1)+1<<2)>>2]=(c[w>>2]|0)+((c[u>>2]|0)>>>16);c[x>>2]=(c[u>>2]<<16)+(c[t>>2]&65535);c[(c[j>>2]|0)+(c[l>>2]<<1<<2)>>2]=(c[x>>2]|0)>>>0;c[l>>2]=(c[l>>2]|0)+1}c[h>>2]=xe(c[f>>2]|0,c[f>>2]|0,(c[g>>2]<<1)-2|0,1)|0;M=qe((c[j>>2]|0)+4|0,(c[j>>2]|0)+4|0,c[f>>2]|0,(c[g>>2]<<1)-2|0)|0;c[h>>2]=(c[h>>2]|0)+M;M=(c[j>>2]|0)+((c[g>>2]<<1)-1<<2)|0;c[M>>2]=(c[M>>2]|0)+(c[h>>2]|0);i=s;return}function _e(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;m=i;i=i+32|0;h=m+28|0;k=m+24|0;l=m+20|0;p=m+16|0;o=m+12|0;j=m+8|0;g=m+4|0;n=m;c[h>>2]=a;c[k>>2]=b;c[l>>2]=d;c[p>>2]=e;c[o>>2]=f;c[n>>2]=0;if((c[k>>2]|0)==(c[p>>2]|0)?(c[l>>2]|0)==(c[o>>2]|0):0){c[j>>2]=ig(c[l>>2]<<1)|0;a=((($e(c[j>>2]|0,c[l>>2]|0)|0)<<2>>>0<65536|0)!=0|0)!=0;o=($e(c[j>>2]|0,c[l>>2]|0)|0)<<2;if(a){a=i;i=i+((1*o|0)+15&-16)|0;o=a}else{o=Nd(n,o)|0}c[g>>2]=o;eg(c[h>>2]|0,c[j>>2]|0,c[k>>2]|0,c[l>>2]|0,c[g>>2]|0)}else{c[j>>2]=dg((c[l>>2]|0)+(c[o>>2]|0)|0)|0;a=(((af(c[j>>2]|0,c[l>>2]|0,c[o>>2]|0)|0)<<2>>>0<65536|0)!=0|0)!=0;f=(af(c[j>>2]|0,c[l>>2]|0,c[o>>2]|0)|0)<<2;if(a){a=i;i=i+((1*f|0)+15&-16)|0;f=a}else{f=Nd(n,f)|0}c[g>>2]=f;ag(c[h>>2]|0,c[j>>2]|0,c[k>>2]|0,c[l>>2]|0,c[p>>2]|0,c[o>>2]|0,c[g>>2]|0)}if((((c[n>>2]|0)!=0|0)!=0|0)==0){i=m;return}Od(c[n>>2]|0);i=m;return}function $e(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;e=i;i=i+16|0;h=e+12|0;f=e+8|0;g=e+4|0;d=e;c[h>>2]=a;c[f>>2]=b;c[g>>2]=c[h>>2]>>1;c[d>>2]=(c[h>>2]|0)+3+((c[f>>2]|0)>(c[g>>2]|0)?c[f>>2]|0:0);i=e;return c[d>>2]|0}function af(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+32|0;g=e+16|0;k=e+12|0;j=e+8|0;h=e+4|0;f=e;c[g>>2]=a;c[k>>2]=b;c[j>>2]=d;c[h>>2]=c[g>>2]>>1;d=(c[g>>2]|0)+4|0;if((c[k>>2]|0)<=(c[h>>2]|0)){k=0;k=d+k|0;c[f>>2]=k;k=c[f>>2]|0;i=e;return k|0}k=(c[j>>2]|0)>(c[h>>2]|0)?c[g>>2]|0:c[h>>2]|0;k=d+k|0;c[f>>2]=k;k=c[f>>2]|0;i=e;return k|0}function bf(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;r=i;i=i+720|0;h=r+704|0;m=r+700|0;l=r+696|0;k=r+692|0;j=r+688|0;z=r+684|0;w=r+680|0;v=r+676|0;u=r+672|0;y=r+668|0;x=r+664|0;g=r+660|0;t=r+656|0;s=r+16|0;p=r+12|0;n=r+8|0;q=r+4|0;o=r;c[m>>2]=a;c[l>>2]=b;c[k>>2]=e;c[j>>2]=f;if((c[j>>2]&(c[j>>2]|0)-1|0)!=0){if(!((c[k>>2]|0)>>>0>=2e3)){c[h>>2]=cf(c[m>>2]|0,c[l>>2]|0,c[k>>2]|0,c[j>>2]|0)|0;a=c[h>>2]|0;i=r;return a|0}c[o>>2]=0;c[p>>2]=c[8256+((c[j>>2]|0)*20|0)>>2];c[q>>2]=(((c[k>>2]|0)>>>0)/((c[p>>2]|0)>>>0)|0)+1;c[g>>2]=Nd(o,(c[q>>2]|0)+32<<2)|0;df(s,c[g>>2]|0,c[q>>2]|0,c[j>>2]|0);c[t>>2]=Nd(o,(c[q>>2]|0)+32<<2)|0;c[n>>2]=ef(c[m>>2]|0,c[l>>2]|0,c[k>>2]|0,s,c[t>>2]|0)|0;if((((c[o>>2]|0)!=0|0)!=0|0)!=0){Od(c[o>>2]|0)}c[h>>2]=c[n>>2];a=c[h>>2]|0;i=r;return a|0}c[y>>2]=c[8268+((c[j>>2]|0)*20|0)>>2];c[u>>2]=0;c[v>>2]=0;c[w>>2]=0;c[z>>2]=(c[l>>2]|0)+(c[k>>2]|0)+ -1;while(1){if(!((c[z>>2]|0)>>>0>=(c[l>>2]|0)>>>0)){break}c[x>>2]=d[c[z>>2]|0]|0;c[v>>2]=c[v>>2]|c[x>>2]<<c[w>>2];c[w>>2]=(c[w>>2]|0)+(c[y>>2]|0);if((c[w>>2]|0)>=32){b=c[v>>2]|0;a=c[u>>2]|0;c[u>>2]=a+1;c[(c[m>>2]|0)+(a<<2)>>2]=b;c[w>>2]=(c[w>>2]|0)-32;c[v>>2]=c[x>>2]>>(c[y>>2]|0)-(c[w>>2]|0)}c[z>>2]=(c[z>>2]|0)+ -1}if((c[v>>2]|0)!=0){b=c[v>>2]|0;a=c[u>>2]|0;c[u>>2]=a+1;c[(c[m>>2]|0)+(a<<2)>>2]=b}c[h>>2]=c[u>>2];a=c[h>>2]|0;i=r;return a|0}function cf(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;o=i;i=i+48|0;m=o+40|0;n=o+36|0;s=o+32|0;h=o+28|0;j=o+24|0;r=o+20|0;g=o+16|0;l=o+12|0;k=o+8|0;q=o+4|0;p=o;c[m>>2]=a;c[n>>2]=b;c[s>>2]=e;c[h>>2]=f;c[k>>2]=c[8268+((c[h>>2]|0)*20|0)>>2];c[q>>2]=c[8256+((c[h>>2]|0)*20|0)>>2];c[j>>2]=0;c[r>>2]=c[q>>2];while(1){if(!((c[r>>2]|0)>>>0<(c[s>>2]|0)>>>0)){break}a=c[n>>2]|0;c[n>>2]=a+1;c[p>>2]=d[a]|0;a:do{if((c[h>>2]|0)==10){c[g>>2]=8;while(1){if((c[g>>2]|0)==0){break a}b=(c[p>>2]|0)*10|0;a=c[n>>2]|0;c[n>>2]=a+1;c[p>>2]=b+(d[a]|0);c[g>>2]=(c[g>>2]|0)+ -1}}else{c[g>>2]=(c[q>>2]|0)-1;while(1){if((c[g>>2]|0)==0){break a}b=ea(c[p>>2]|0,c[h>>2]|0)|0;a=c[n>>2]|0;c[n>>2]=a+1;c[p>>2]=b+(d[a]|0);c[g>>2]=(c[g>>2]|0)+ -1}}}while(0);if((c[j>>2]|0)==0){if((c[p>>2]|0)!=0){c[c[m>>2]>>2]=c[p>>2];c[j>>2]=1}}else{c[l>>2]=ue(c[m>>2]|0,c[m>>2]|0,c[j>>2]|0,c[k>>2]|0)|0;a=pe(c[m>>2]|0,c[m>>2]|0,c[j>>2]|0,c[p>>2]|0)|0;c[l>>2]=(c[l>>2]|0)+a;if((c[l>>2]|0)!=0){b=c[l>>2]|0;a=c[j>>2]|0;c[j>>2]=a+1;c[(c[m>>2]|0)+(a<<2)>>2]=b}}c[r>>2]=(c[r>>2]|0)+(c[q>>2]|0)}c[k>>2]=c[h>>2];a=c[n>>2]|0;c[n>>2]=a+1;c[p>>2]=d[a]|0;s=c[s>>2]|0;r=c[r>>2]|0;b:do{if((c[h>>2]|0)==10){c[g>>2]=s-(r-9)-1;while(1){if((c[g>>2]|0)<=0){break b}b=(c[p>>2]|0)*10|0;a=c[n>>2]|0;c[n>>2]=a+1;c[p>>2]=b+(d[a]|0);c[k>>2]=(c[k>>2]|0)*10;c[g>>2]=(c[g>>2]|0)+ -1}}else{c[g>>2]=s-(r-(c[q>>2]|0))-1;while(1){if((c[g>>2]|0)<=0){break b}b=ea(c[p>>2]|0,c[h>>2]|0)|0;a=c[n>>2]|0;c[n>>2]=a+1;c[p>>2]=b+(d[a]|0);c[k>>2]=ea(c[k>>2]|0,c[h>>2]|0)|0;c[g>>2]=(c[g>>2]|0)+ -1}}}while(0);if((c[j>>2]|0)==0){if((c[p>>2]|0)==0){a=c[j>>2]|0;i=o;return a|0}c[c[m>>2]>>2]=c[p>>2];c[j>>2]=1;a=c[j>>2]|0;i=o;return a|0}else{c[l>>2]=ue(c[m>>2]|0,c[m>>2]|0,c[j>>2]|0,c[k>>2]|0)|0;a=pe(c[m>>2]|0,c[m>>2]|0,c[j>>2]|0,c[p>>2]|0)|0;c[l>>2]=(c[l>>2]|0)+a;if((c[l>>2]|0)==0){a=c[j>>2]|0;i=o;return a|0}b=c[l>>2]|0;a=c[j>>2]|0;c[j>>2]=a+1;c[(c[m>>2]|0)+(a<<2)>>2]=b;a=c[j>>2]|0;i=o;return a|0}return 0}function df(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;g=i;i=i+64|0;t=g+60|0;s=g+56|0;h=g+52|0;u=g+48|0;r=g+44|0;x=g+40|0;q=g+36|0;k=g+32|0;o=g+28|0;j=g+24|0;l=g+20|0;n=g+16|0;m=g+12|0;p=g+8|0;w=g+4|0;v=g;c[t>>2]=a;c[s>>2]=b;c[h>>2]=e;c[u>>2]=f;c[r>>2]=c[s>>2];c[n>>2]=c[8256+((c[u>>2]|0)*20|0)>>2];c[l>>2]=c[8268+((c[u>>2]|0)*20|0)>>2];c[o>>2]=c[r>>2];c[r>>2]=(c[r>>2]|0)+4;c[m>>2]=c[n>>2];c[c[o>>2]>>2]=c[l>>2];c[k>>2]=1;c[w>>2]=(c[h>>2]|0)-1;f=c[w>>2]|0;if((c[w>>2]|0)>>>0<65536){f=f>>>0<256?1:9}else{f=f>>>0<16777216?17:25}c[v>>2]=f;c[x>>2]=33-(c[v>>2]|0)-(d[7496+((c[w>>2]|0)>>>(c[v>>2]|0))|0]|0);c[x>>2]=31-(c[x>>2]|0);c[(c[t>>2]|0)+((c[x>>2]|0)*20|0)>>2]=c[o>>2];c[(c[t>>2]|0)+((c[x>>2]|0)*20|0)+4>>2]=c[k>>2];c[(c[t>>2]|0)+((c[x>>2]|0)*20|0)+12>>2]=c[m>>2];c[(c[t>>2]|0)+((c[x>>2]|0)*20|0)+16>>2]=c[u>>2];c[(c[t>>2]|0)+((c[x>>2]|0)*20|0)+8>>2]=0;c[p>>2]=0;c[q>>2]=(c[x>>2]|0)-1;while(1){if((c[q>>2]|0)<0){h=16;break}c[j>>2]=c[r>>2];c[r>>2]=(c[r>>2]|0)+(c[k>>2]<<1<<2);if(((((c[r>>2]|0)>>>0<((c[s>>2]|0)+((c[h>>2]|0)+32<<2)|0)>>>0^1)&1|0)!=0|0)!=0){h=7;break}Xe(c[j>>2]|0,c[o>>2]|0,c[k>>2]|0);c[k>>2]=(c[k>>2]<<1)-1;c[k>>2]=(c[k>>2]|0)+((c[(c[j>>2]|0)+(c[k>>2]<<2)>>2]|0)!=0);c[m>>2]=c[m>>2]<<1;if(((c[h>>2]|0)-1>>c[q>>2]&2|0)==0){ze(c[j>>2]|0,c[j>>2]|0,c[k>>2]|0,c[l>>2]|0);c[k>>2]=(c[k>>2]|0)-((c[(c[j>>2]|0)+((c[k>>2]|0)-1<<2)>>2]|0)==0);c[m>>2]=(c[m>>2]|0)-(c[n>>2]|0)}c[p>>2]=c[p>>2]<<1;while(1){if((c[c[j>>2]>>2]|0)==0){w=(c[(c[j>>2]|0)+4>>2]&(c[l>>2]&0-(c[l>>2]|0))-1|0)==0}else{w=0}v=c[j>>2]|0;if(!w){break}c[j>>2]=v+4;c[k>>2]=(c[k>>2]|0)+ -1;c[p>>2]=(c[p>>2]|0)+1}c[o>>2]=v;c[(c[t>>2]|0)+((c[q>>2]|0)*20|0)>>2]=c[o>>2];c[(c[t>>2]|0)+((c[q>>2]|0)*20|0)+4>>2]=c[k>>2];c[(c[t>>2]|0)+((c[q>>2]|0)*20|0)+12>>2]=c[m>>2];c[(c[t>>2]|0)+((c[q>>2]|0)*20|0)+16>>2]=c[u>>2];c[(c[t>>2]|0)+((c[q>>2]|0)*20|0)+8>>2]=c[p>>2];c[q>>2]=(c[q>>2]|0)+ -1}if((h|0)==7){Hd(13688,178,13744)}else if((h|0)==16){i=g;return}}function ef(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;g=i;i=i+80|0;j=g+72|0;n=g+68|0;u=g+64|0;v=g+60|0;k=g+56|0;h=g+52|0;t=g+48|0;A=g+44|0;p=g+40|0;o=g+36|0;m=g+32|0;l=g+28|0;s=g+24|0;y=g+20|0;z=g+16|0;w=g+12|0;x=g+8|0;r=g+4|0;q=g;c[n>>2]=a;c[u>>2]=b;c[v>>2]=d;c[k>>2]=e;c[h>>2]=f;c[t>>2]=c[(c[k>>2]|0)+12>>2];f=c[v>>2]|0;if((c[v>>2]|0)>>>0<=(c[t>>2]|0)>>>0){l=c[n>>2]|0;m=c[u>>2]|0;n=c[v>>2]|0;k=c[k>>2]|0;if(f>>>0>=750){c[j>>2]=ef(l,m,n,k+20|0,c[h>>2]|0)|0;a=c[j>>2]|0;i=g;return a|0}else{c[j>>2]=cf(l,m,n,c[k+16>>2]|0)|0;a=c[j>>2]|0;i=g;return a|0}}c[A>>2]=f-(c[t>>2]|0);f=c[h>>2]|0;b=c[u>>2]|0;d=c[A>>2]|0;e=c[k>>2]|0;if((c[A>>2]|0)>>>0>=750){c[m>>2]=ef(f,b,d,e+20|0,c[n>>2]|0)|0}else{c[m>>2]=cf(f,b,d,c[e+16>>2]|0)|0}c[s>>2]=c[(c[k>>2]|0)+8>>2];A=c[(c[k>>2]|0)+4>>2]|0;if((c[m>>2]|0)==0){if((A+(c[s>>2]|0)+1|0)!=0){c[y>>2]=c[n>>2];c[z>>2]=(c[(c[k>>2]|0)+4>>2]|0)+(c[s>>2]|0)+1;do{a=c[y>>2]|0;c[y>>2]=a+4;c[a>>2]=0;a=(c[z>>2]|0)+ -1|0;c[z>>2]=a}while((a|0)!=0)}}else{y=(c[n>>2]|0)+(c[s>>2]<<2)|0;if((A|0)>(c[m>>2]|0)){De(y,c[c[k>>2]>>2]|0,c[(c[k>>2]|0)+4>>2]|0,c[h>>2]|0,c[m>>2]|0)|0}else{De(y,c[h>>2]|0,c[m>>2]|0,c[c[k>>2]>>2]|0,c[(c[k>>2]|0)+4>>2]|0)|0}if((c[s>>2]|0)!=0){c[w>>2]=c[n>>2];c[x>>2]=c[s>>2];do{a=c[w>>2]|0;c[w>>2]=a+4;c[a>>2]=0;a=(c[x>>2]|0)+ -1|0;c[x>>2]=a}while((a|0)!=0)}}c[u>>2]=(c[u>>2]|0)+(c[v>>2]|0)+(0-(c[t>>2]|0));v=c[h>>2]|0;x=c[u>>2]|0;w=c[t>>2]|0;u=c[k>>2]|0;if((c[t>>2]|0)>>>0>=750){c[o>>2]=ef(v,x,w,u+20|0,(c[h>>2]|0)+(c[(c[k>>2]|0)+4>>2]<<2)+(c[s>>2]<<2)+4|0)|0}else{c[o>>2]=cf(v,x,w,c[u+16>>2]|0)|0}if((c[o>>2]|0)!=0?(c[p>>2]=qe(c[n>>2]|0,c[n>>2]|0,c[h>>2]|0,c[o>>2]|0)|0,c[q>>2]=(c[n>>2]|0)+(c[o>>2]<<2),c[r>>2]=(c[c[q>>2]>>2]|0)+(c[p>>2]|0),c[c[q>>2]>>2]=c[r>>2],(c[r>>2]|0)>>>0<(c[p>>2]|0)>>>0):0){do{b=(c[q>>2]|0)+4|0;c[q>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[l>>2]=(c[m>>2]|0)+(c[(c[k>>2]|0)+4>>2]|0)+(c[s>>2]|0);c[j>>2]=(c[l>>2]|0)-((c[(c[n>>2]|0)+((c[l>>2]|0)-1<<2)>>2]|0)==0);a=c[j>>2]|0;i=g;return a|0}function ff(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+32|0;e=g+24|0;m=g+20|0;n=g+16|0;k=g+12|0;l=g+8|0;h=g+4|0;j=g;c[e>>2]=a;c[m>>2]=b;c[n>>2]=d;c[k>>2]=0;c[l>>2]=c[n>>2];do{n=(c[l>>2]|0)+ -1|0;c[l>>2]=n;if((n|0)<0){f=5;break}c[h>>2]=c[(c[e>>2]|0)+(c[l>>2]<<2)>>2];c[j>>2]=c[(c[m>>2]|0)+(c[l>>2]<<2)>>2]}while((c[h>>2]|0)==(c[j>>2]|0));if((f|0)==5){n=c[k>>2]|0;i=g;return n|0}c[k>>2]=(c[h>>2]|0)>>>0>(c[j>>2]|0)>>>0?1:-1;n=c[k>>2]|0;i=g;return n|0}function gf(a,b,e,f,g,h,j){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Pb=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0,Zb=0;l=i;i=i+608|0;m=l+592|0;k=l+588|0;Zb=l+584|0;o=l+580|0;n=l+576|0;r=l+572|0;q=l+568|0;wb=l+564|0;vb=l+560|0;xb=l+556|0;Bb=l+552|0;zb=l+548|0;Ab=l+544|0;Pb=l+536|0;Kb=l+528|0;Ob=l+524|0;Nb=l+520|0;Rb=l+516|0;Mb=l+512|0;Qb=l+508|0;t=l+504|0;s=l+500|0;p=l+496|0;pa=l+492|0;oa=l+488|0;yb=l+484|0;ra=l+480|0;Ub=l+476|0;Lb=l+472|0;Sb=l+468|0;Ib=l+464|0;Tb=l+460|0;Jb=l+456|0;qb=l+452|0;ob=l+448|0;hb=l+444|0;pb=l+440|0;ub=l+436|0;mb=l+432|0;kb=l+428|0;eb=l+424|0;rb=l+420|0;nb=l+416|0;lb=l+412|0;tb=l+408|0;sb=l+404|0;gb=l+400|0;ib=l+396|0;_a=l+392|0;jb=l+388|0;cb=l+384|0;ab=l+380|0;bb=l+376|0;$a=l+372|0;fb=l+368|0;db=l+364|0;Aa=l+360|0;qa=l+356|0;na=l+352|0;ma=l+348|0;la=l+344|0;ka=l+340|0;I=l+336|0;D=l+332|0;V=l+328|0;J=l+324|0;v=l+320|0;H=l+316|0;G=l+312|0;A=l+308|0;X=l+304|0;Yb=l+300|0;Wb=l+296|0;Xb=l+292|0;Vb=l+288|0;Db=l+284|0;Cb=l+280|0;Hb=l+276|0;Fb=l+272|0;Gb=l+268|0;Eb=l+264|0;Ba=l+260|0;za=l+256|0;xa=l+252|0;Fa=l+248|0;Da=l+244|0;Ca=l+240|0;ya=l+236|0;Ma=l+232|0;Ea=l+228|0;Na=l+224|0;Pa=l+220|0;Sa=l+216|0;Oa=l+212|0;Ka=l+208|0;Ga=l+204|0;va=l+200|0;ua=l+196|0;Ia=l+192|0;Ha=l+188|0;ta=l+184|0;wa=l+180|0;Ja=l+176|0;Ta=l+172|0;Ra=l+168|0;La=l+164|0;Qa=l+160|0;Wa=l+156|0;Ya=l+152|0;Xa=l+148|0;Za=l+144|0;Ua=l+140|0;Va=l+136|0;sa=l+132|0;ha=l+128|0;ia=l+124|0;L=l+120|0;Y=l+116|0;T=l+112|0;$=l+108|0;N=l+104|0;M=l+100|0;Q=l+96|0;O=l+92|0;P=l+88|0;R=l+84|0;aa=l+80|0;S=l+76|0;fa=l+72|0;ca=l+68|0;da=l+64|0;ba=l+60|0;ja=l+56|0;ga=l+52|0;W=l+48|0;U=l+44|0;Z=l+40|0;_=l+36|0;F=l+32|0;E=l+28|0;u=l+24|0;B=l+20|0;y=l+16|0;w=l+12|0;x=l+8|0;C=l+4|0;z=l;c[m>>2]=a;c[k>>2]=b;c[Zb>>2]=e;c[o>>2]=f;c[n>>2]=g;c[r>>2]=h;c[q>>2]=j;if(((((c[Zb>>2]|0)==0^1)&1|0)!=0|0)!=0){Hd(13792,51,13848)}j=c[q>>2]|0;if((j|0)==1){Zb=Ae(c[m>>2]|0,0,c[o>>2]|0,c[n>>2]|0,c[c[r>>2]>>2]|0)|0;c[c[k>>2]>>2]=Zb;i=l;return}else if((j|0)==0){Jd()}else if((j|0)==2){c[zb>>2]=0;p=c[r>>2]|0;if((c[(c[r>>2]|0)+4>>2]&-2147483648|0)==0){c[Kb>>2]=c[p+4>>2];p=c[Kb>>2]|0;if((c[Kb>>2]|0)>>>0<65536){p=p>>>0<256?1:9}else{p=p>>>0<16777216?17:25}c[Ob>>2]=p;c[Ab>>2]=33-(c[Ob>>2]|0)-(d[7496+((c[Kb>>2]|0)>>>(c[Ob>>2]|0))|0]|0);c[Ab>>2]=(c[Ab>>2]|0)-0;c[vb>>2]=Pb;c[(c[vb>>2]|0)+4>>2]=c[(c[r>>2]|0)+4>>2]<<c[Ab>>2]|(c[c[r>>2]>>2]|0)>>>(32-(c[Ab>>2]|0)|0);c[c[vb>>2]>>2]=c[c[r>>2]>>2]<<c[Ab>>2];p=(c[n>>2]|0)+1<<2;if((((c[n>>2]|0)+1<<2>>>0<65536|0)!=0|0)!=0){Zb=i;i=i+((1*p|0)+15&-16)|0;p=Zb}else{p=Nd(zb,p)|0}c[wb>>2]=p;c[Bb>>2]=xe(c[wb>>2]|0,c[o>>2]|0,c[n>>2]|0,c[Ab>>2]|0)|0;c[(c[wb>>2]|0)+(c[n>>2]<<2)>>2]=c[Bb>>2];c[xb>>2]=Be(c[m>>2]|0,0,c[wb>>2]|0,(c[n>>2]|0)+((c[Bb>>2]|0)!=0)|0,c[vb>>2]|0)|0;if((c[Bb>>2]|0)==0){c[(c[m>>2]|0)+((c[n>>2]|0)-2<<2)>>2]=c[xb>>2]}c[c[k>>2]>>2]=(c[c[wb>>2]>>2]|0)>>>(c[Ab>>2]|0)|c[(c[wb>>2]|0)+4>>2]<<32-(c[Ab>>2]|0);c[(c[k>>2]|0)+4>>2]=(c[(c[wb>>2]|0)+4>>2]|0)>>>(c[Ab>>2]|0)}else{c[vb>>2]=p;p=c[n>>2]<<2;if(((c[n>>2]<<2>>>0<65536|0)!=0|0)!=0){Zb=i;i=i+((1*p|0)+15&-16)|0;p=Zb}else{p=Nd(zb,p)|0}c[wb>>2]=p;if((c[n>>2]|0)!=0){c[Nb>>2]=(c[n>>2]|0)-1;c[Rb>>2]=c[wb>>2];c[Mb>>2]=c[o>>2];Zb=c[Mb>>2]|0;c[Mb>>2]=Zb+4;c[Qb>>2]=c[Zb>>2];if((c[Nb>>2]|0)!=0){do{a=c[Qb>>2]|0;Zb=c[Rb>>2]|0;c[Rb>>2]=Zb+4;c[Zb>>2]=a;Zb=c[Mb>>2]|0;c[Mb>>2]=Zb+4;c[Qb>>2]=c[Zb>>2];Zb=(c[Nb>>2]|0)+ -1|0;c[Nb>>2]=Zb}while((Zb|0)!=0)}a=c[Qb>>2]|0;Zb=c[Rb>>2]|0;c[Rb>>2]=Zb+4;c[Zb>>2]=a}c[xb>>2]=Be(c[m>>2]|0,0,c[wb>>2]|0,c[n>>2]|0,c[vb>>2]|0)|0;c[(c[m>>2]|0)+((c[n>>2]|0)-2<<2)>>2]=c[xb>>2];c[c[k>>2]>>2]=c[c[wb>>2]>>2];c[(c[k>>2]|0)+4>>2]=c[(c[wb>>2]|0)+4>>2]}if((((c[zb>>2]|0)!=0|0)!=0|0)==0){i=l;return}Od(c[zb>>2]|0);i=l;return}else{c[p>>2]=0;c[t>>2]=(c[(c[o>>2]|0)+((c[n>>2]|0)-1<<2)>>2]|0)>>>0>=(c[(c[r>>2]|0)+((c[q>>2]|0)-1<<2)>>2]|0)>>>0;vb=(c[n>>2]|0)-(c[q>>2]|0)|0;if(((c[n>>2]|0)+(c[t>>2]|0)|0)>=(c[q>>2]<<1|0)){c[(c[m>>2]|0)+(vb<<2)>>2]=0;if((c[(c[r>>2]|0)+((c[q>>2]|0)-1<<2)>>2]&-2147483648|0)==0){c[Ub>>2]=c[(c[r>>2]|0)+((c[q>>2]|0)-1<<2)>>2];u=c[Ub>>2]|0;if((c[Ub>>2]|0)>>>0<65536){u=u>>>0<256?1:9}else{u=u>>>0<16777216?17:25}c[Lb>>2]=u;c[ra>>2]=33-(c[Lb>>2]|0)-(d[7496+((c[Ub>>2]|0)>>>(c[Lb>>2]|0))|0]|0);c[ra>>2]=(c[ra>>2]|0)-0;u=c[q>>2]<<2;if(((c[q>>2]<<2>>>0<65536|0)!=0|0)!=0){Zb=i;i=i+((1*u|0)+15&-16)|0;u=Zb}else{u=Nd(p,u)|0}c[oa>>2]=u;xe(c[oa>>2]|0,c[r>>2]|0,c[q>>2]|0,c[ra>>2]|0)|0;r=(c[n>>2]|0)+1<<2;if((((c[n>>2]|0)+1<<2>>>0<65536|0)!=0|0)!=0){Zb=i;i=i+((1*r|0)+15&-16)|0;r=Zb}else{r=Nd(p,r)|0}c[pa>>2]=r;c[yb>>2]=xe(c[pa>>2]|0,c[o>>2]|0,c[n>>2]|0,c[ra>>2]|0)|0;c[(c[pa>>2]|0)+(c[n>>2]<<2)>>2]=c[yb>>2];c[n>>2]=(c[n>>2]|0)+(c[t>>2]|0)}else{c[ra>>2]=0;c[oa>>2]=c[r>>2];r=(c[n>>2]|0)+1<<2;if((((c[n>>2]|0)+1<<2>>>0<65536|0)!=0|0)!=0){Zb=i;i=i+((1*r|0)+15&-16)|0;r=Zb}else{r=Nd(p,r)|0}c[pa>>2]=r;if((c[n>>2]|0)!=0){c[Sb>>2]=(c[n>>2]|0)-1;c[Ib>>2]=c[pa>>2];c[Tb>>2]=c[o>>2];Zb=c[Tb>>2]|0;c[Tb>>2]=Zb+4;c[Jb>>2]=c[Zb>>2];if((c[Sb>>2]|0)!=0){do{a=c[Jb>>2]|0;Zb=c[Ib>>2]|0;c[Ib>>2]=Zb+4;c[Zb>>2]=a;Zb=c[Tb>>2]|0;c[Tb>>2]=Zb+4;c[Jb>>2]=c[Zb>>2];Zb=(c[Sb>>2]|0)+ -1|0;c[Sb>>2]=Zb}while((Zb|0)!=0)}a=c[Jb>>2]|0;Zb=c[Ib>>2]|0;c[Ib>>2]=Zb+4;c[Zb>>2]=a}c[(c[pa>>2]|0)+(c[n>>2]<<2)>>2]=0;c[n>>2]=(c[n>>2]|0)+(c[t>>2]|0)}c[kb>>2]=(c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2]|0)>>>16;c[eb>>2]=c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2]&65535;c[rb>>2]=(~c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2]>>>0)/((c[kb>>2]|0)>>>0)|0;c[lb>>2]=~c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2]-(ea(c[rb>>2]|0,c[kb>>2]|0)|0);c[sb>>2]=ea(c[rb>>2]|0,c[eb>>2]|0)|0;c[lb>>2]=c[lb>>2]<<16|65535;if(((c[lb>>2]|0)>>>0<(c[sb>>2]|0)>>>0?(c[rb>>2]=(c[rb>>2]|0)+ -1,c[lb>>2]=(c[lb>>2]|0)+(c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2]|0),(c[lb>>2]|0)>>>0>=(c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2]|0)>>>0):0)?(c[lb>>2]|0)>>>0<(c[sb>>2]|0)>>>0:0){c[rb>>2]=(c[rb>>2]|0)+ -1;c[lb>>2]=(c[lb>>2]|0)+(c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2]|0)}c[lb>>2]=(c[lb>>2]|0)-(c[sb>>2]|0);c[nb>>2]=((c[lb>>2]|0)>>>0)/((c[kb>>2]|0)>>>0)|0;c[tb>>2]=(c[lb>>2]|0)-(ea(c[nb>>2]|0,c[kb>>2]|0)|0);c[sb>>2]=ea(c[nb>>2]|0,c[eb>>2]|0)|0;c[tb>>2]=c[tb>>2]<<16|65535;if(((c[tb>>2]|0)>>>0<(c[sb>>2]|0)>>>0?(c[nb>>2]=(c[nb>>2]|0)+ -1,c[tb>>2]=(c[tb>>2]|0)+(c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2]|0),(c[tb>>2]|0)>>>0>=(c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2]|0)>>>0):0)?(c[tb>>2]|0)>>>0<(c[sb>>2]|0)>>>0:0){c[nb>>2]=(c[nb>>2]|0)+ -1;c[tb>>2]=(c[tb>>2]|0)+(c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2]|0)}c[tb>>2]=(c[tb>>2]|0)-(c[sb>>2]|0);c[qb>>2]=c[rb>>2]<<16|c[nb>>2];c[mb>>2]=c[tb>>2];c[ob>>2]=ea(c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2]|0,c[qb>>2]|0)|0;c[ob>>2]=(c[ob>>2]|0)+(c[(c[oa>>2]|0)+((c[q>>2]|0)-2<<2)>>2]|0);if((c[ob>>2]|0)>>>0<(c[(c[oa>>2]|0)+((c[q>>2]|0)-2<<2)>>2]|0)>>>0){c[qb>>2]=(c[qb>>2]|0)+ -1;c[ub>>2]=0-((c[ob>>2]|0)>>>0>=(c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2]|0)>>>0);c[ob>>2]=(c[ob>>2]|0)-(c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2]|0);c[qb>>2]=(c[qb>>2]|0)+(c[ub>>2]|0);c[ob>>2]=(c[ob>>2]|0)-(c[ub>>2]&c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2])}c[fb>>2]=c[(c[oa>>2]|0)+((c[q>>2]|0)-2<<2)>>2];c[db>>2]=c[qb>>2];c[cb>>2]=c[fb>>2]&65535;c[bb>>2]=(c[fb>>2]|0)>>>16;c[ab>>2]=c[db>>2]&65535;c[$a>>2]=(c[db>>2]|0)>>>16;c[gb>>2]=ea(c[cb>>2]|0,c[ab>>2]|0)|0;c[ib>>2]=ea(c[cb>>2]|0,c[$a>>2]|0)|0;c[_a>>2]=ea(c[bb>>2]|0,c[ab>>2]|0)|0;c[jb>>2]=ea(c[bb>>2]|0,c[$a>>2]|0)|0;c[ib>>2]=(c[ib>>2]|0)+((c[gb>>2]|0)>>>16);c[ib>>2]=(c[ib>>2]|0)+(c[_a>>2]|0);if((c[ib>>2]|0)>>>0<(c[_a>>2]|0)>>>0){c[jb>>2]=(c[jb>>2]|0)+65536}c[hb>>2]=(c[jb>>2]|0)+((c[ib>>2]|0)>>>16);c[pb>>2]=(c[ib>>2]<<16)+(c[gb>>2]&65535);c[ob>>2]=(c[ob>>2]|0)+(c[hb>>2]|0);do{if((c[ob>>2]|0)>>>0<(c[hb>>2]|0)>>>0?(c[qb>>2]=(c[qb>>2]|0)+ -1,(((c[ob>>2]|0)>>>0>=(c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2]|0)>>>0|0)!=0|0)!=0):0){if(!((c[ob>>2]|0)>>>0>(c[(c[oa>>2]|0)+((c[q>>2]|0)-1<<2)>>2]|0)>>>0)?!((c[pb>>2]|0)>>>0>=(c[(c[oa>>2]|0)+((c[q>>2]|0)-2<<2)>>2]|0)>>>0):0){break}c[qb>>2]=(c[qb>>2]|0)+ -1}}while(0);c[s>>2]=c[qb>>2];do{if((c[q>>2]|0)>=50){if(((c[q>>2]|0)>=200?(c[n>>2]|0)>=4e3:0)?!(+(c[q>>2]|0)*3600.0+ +(c[n>>2]|0)*200.0>+(c[q>>2]|0)*+(c[n>>2]|0)):0){c[Aa>>2]=sg(c[n>>2]|0,c[q>>2]|0,0)|0;o=c[Aa>>2]<<2;if(((c[Aa>>2]<<2>>>0<65536|0)!=0|0)!=0){Zb=i;i=i+((1*o|0)+15&-16)|0;o=Zb}else{o=Nd(p,o)|0}c[qa>>2]=o;ng(c[m>>2]|0,c[k>>2]|0,c[pa>>2]|0,c[n>>2]|0,c[oa>>2]|0,c[q>>2]|0,c[qa>>2]|0)|0;c[pa>>2]=c[k>>2];break}mg(c[m>>2]|0,c[pa>>2]|0,c[n>>2]|0,c[oa>>2]|0,c[q>>2]|0,s)|0}else{jg(c[m>>2]|0,c[pa>>2]|0,c[n>>2]|0,c[oa>>2]|0,c[q>>2]|0,c[s>>2]|0)|0}}while(0);if((c[ra>>2]|0)==0){if((c[q>>2]|0)!=0){c[na>>2]=(c[q>>2]|0)-1;c[ma>>2]=c[k>>2];c[la>>2]=c[pa>>2];Zb=c[la>>2]|0;c[la>>2]=Zb+4;c[ka>>2]=c[Zb>>2];if((c[na>>2]|0)!=0){do{a=c[ka>>2]|0;Zb=c[ma>>2]|0;c[ma>>2]=Zb+4;c[Zb>>2]=a;Zb=c[la>>2]|0;c[la>>2]=Zb+4;c[ka>>2]=c[Zb>>2];Zb=(c[na>>2]|0)+ -1|0;c[na>>2]=Zb}while((Zb|0)!=0)}a=c[ka>>2]|0;Zb=c[ma>>2]|0;c[ma>>2]=Zb+4;c[Zb>>2]=a}}else{ye(c[k>>2]|0,c[pa>>2]|0,c[q>>2]|0,c[ra>>2]|0)|0}if((((c[p>>2]|0)!=0|0)!=0|0)==0){i=l;return}Od(c[p>>2]|0);i=l;return}c[I>>2]=vb;c[(c[m>>2]|0)+(c[I>>2]<<2)>>2]=0;c[I>>2]=(c[I>>2]|0)+(c[t>>2]|0);ka=c[q>>2]|0;if((c[I>>2]|0)==0){if((ka|0)!=0){c[Yb>>2]=(c[q>>2]|0)-1;c[Wb>>2]=c[k>>2];c[Xb>>2]=c[o>>2];Zb=c[Xb>>2]|0;c[Xb>>2]=Zb+4;c[Vb>>2]=c[Zb>>2];if((c[Yb>>2]|0)!=0){do{a=c[Vb>>2]|0;Zb=c[Wb>>2]|0;c[Wb>>2]=Zb+4;c[Zb>>2]=a;Zb=c[Xb>>2]|0;c[Xb>>2]=Zb+4;c[Vb>>2]=c[Zb>>2];Zb=(c[Yb>>2]|0)+ -1|0;c[Yb>>2]=Zb}while((Zb|0)!=0)}a=c[Vb>>2]|0;Zb=c[Wb>>2]|0;c[Wb>>2]=Zb+4;c[Zb>>2]=a}if((((c[p>>2]|0)!=0|0)!=0|0)==0){i=l;return}Od(c[p>>2]|0);i=l;return}c[H>>2]=ka-(c[I>>2]|0);do{if((c[(c[r>>2]|0)+((c[q>>2]|0)-1<<2)>>2]&-2147483648|0)==0){c[Db>>2]=c[(c[r>>2]|0)+((c[q>>2]|0)-1<<2)>>2];ka=c[Db>>2]|0;if((c[Db>>2]|0)>>>0<65536){ka=ka>>>0<256?1:9}else{ka=ka>>>0<16777216?17:25}c[Cb>>2]=ka;c[X>>2]=33-(c[Cb>>2]|0)-(d[7496+((c[Db>>2]|0)>>>(c[Cb>>2]|0))|0]|0);c[X>>2]=(c[X>>2]|0)-0;ka=c[I>>2]<<2;if(((c[I>>2]<<2>>>0<65536|0)!=0|0)!=0){Zb=i;i=i+((1*ka|0)+15&-16)|0;ka=Zb}else{ka=Nd(p,ka)|0}c[V>>2]=ka;xe(c[V>>2]|0,(c[r>>2]|0)+(c[H>>2]<<2)|0,c[I>>2]|0,c[X>>2]|0)|0;ka=c[V>>2]|0;c[ka>>2]=c[ka>>2]|(c[(c[r>>2]|0)+((c[H>>2]|0)-1<<2)>>2]|0)>>>(32-(c[X>>2]|0)|0);ka=(c[I>>2]<<1)+1<<2;if((((c[I>>2]<<1)+1<<2>>>0<65536|0)!=0|0)!=0){Zb=i;i=i+((1*ka|0)+15&-16)|0;ka=Zb}else{ka=Nd(p,ka)|0}c[D>>2]=ka;c[v>>2]=xe(c[D>>2]|0,(c[o>>2]|0)+(c[n>>2]<<2)+(0-(c[I>>2]<<1)<<2)|0,c[I>>2]<<1,c[X>>2]|0)|0;if((c[t>>2]|0)!=0){c[(c[D>>2]|0)+(c[I>>2]<<1<<2)>>2]=c[v>>2];c[D>>2]=(c[D>>2]|0)+4;break}else{Zb=c[D>>2]|0;c[Zb>>2]=c[Zb>>2]|(c[(c[o>>2]|0)+((c[n>>2]|0)-(c[I>>2]<<1)-1<<2)>>2]|0)>>>(32-(c[X>>2]|0)|0);break}}else{c[X>>2]=0;c[V>>2]=(c[r>>2]|0)+(c[H>>2]<<2);ka=(c[I>>2]<<1)+1<<2;if((((c[I>>2]<<1)+1<<2>>>0<65536|0)!=0|0)!=0){Zb=i;i=i+((1*ka|0)+15&-16)|0;ka=Zb}else{ka=Nd(p,ka)|0}c[D>>2]=ka;if((c[I>>2]<<1|0)!=0){c[Hb>>2]=(c[I>>2]<<1)-1;c[Fb>>2]=c[D>>2];c[Gb>>2]=(c[o>>2]|0)+(c[n>>2]<<2)+(0-(c[I>>2]<<1)<<2);Zb=c[Gb>>2]|0;c[Gb>>2]=Zb+4;c[Eb>>2]=c[Zb>>2];if((c[Hb>>2]|0)!=0){do{a=c[Eb>>2]|0;Zb=c[Fb>>2]|0;c[Fb>>2]=Zb+4;c[Zb>>2]=a;Zb=c[Gb>>2]|0;c[Gb>>2]=Zb+4;c[Eb>>2]=c[Zb>>2];Zb=(c[Hb>>2]|0)+ -1|0;c[Hb>>2]=Zb}while((Zb|0)!=0)}a=c[Eb>>2]|0;Zb=c[Fb>>2]|0;c[Fb>>2]=Zb+4;c[Zb>>2]=a}if((c[t>>2]|0)!=0){c[(c[D>>2]|0)+(c[I>>2]<<1<<2)>>2]=0;c[D>>2]=(c[D>>2]|0)+4}}}while(0);do{if((c[I>>2]|0)!=1){if((c[I>>2]|0)==2){Be(c[m>>2]|0,0,c[D>>2]|0,4,c[V>>2]|0)|0;break}c[va>>2]=(c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2]|0)>>>16;c[ua>>2]=c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2]&65535;c[Ia>>2]=(~c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2]>>>0)/((c[va>>2]|0)>>>0)|0;c[ta>>2]=~c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2]-(ea(c[Ia>>2]|0,c[va>>2]|0)|0);c[Ja>>2]=ea(c[Ia>>2]|0,c[ua>>2]|0)|0;c[ta>>2]=c[ta>>2]<<16|65535;if(((c[ta>>2]|0)>>>0<(c[Ja>>2]|0)>>>0?(c[Ia>>2]=(c[Ia>>2]|0)+ -1,c[ta>>2]=(c[ta>>2]|0)+(c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2]|0),(c[ta>>2]|0)>>>0>=(c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2]|0)>>>0):0)?(c[ta>>2]|0)>>>0<(c[Ja>>2]|0)>>>0:0){c[Ia>>2]=(c[Ia>>2]|0)+ -1;c[ta>>2]=(c[ta>>2]|0)+(c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2]|0)}c[ta>>2]=(c[ta>>2]|0)-(c[Ja>>2]|0);c[Ha>>2]=((c[ta>>2]|0)>>>0)/((c[va>>2]|0)>>>0)|0;c[wa>>2]=(c[ta>>2]|0)-(ea(c[Ha>>2]|0,c[va>>2]|0)|0);c[Ja>>2]=ea(c[Ha>>2]|0,c[ua>>2]|0)|0;c[wa>>2]=c[wa>>2]<<16|65535;if(((c[wa>>2]|0)>>>0<(c[Ja>>2]|0)>>>0?(c[Ha>>2]=(c[Ha>>2]|0)+ -1,c[wa>>2]=(c[wa>>2]|0)+(c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2]|0),(c[wa>>2]|0)>>>0>=(c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2]|0)>>>0):0)?(c[wa>>2]|0)>>>0<(c[Ja>>2]|0)>>>0:0){c[Ha>>2]=(c[Ha>>2]|0)+ -1;c[wa>>2]=(c[wa>>2]|0)+(c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2]|0)}c[wa>>2]=(c[wa>>2]|0)-(c[Ja>>2]|0);c[Na>>2]=c[Ia>>2]<<16|c[Ha>>2];c[Ga>>2]=c[wa>>2];c[Pa>>2]=ea(c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2]|0,c[Na>>2]|0)|0;c[Pa>>2]=(c[Pa>>2]|0)+(c[(c[V>>2]|0)+((c[I>>2]|0)-2<<2)>>2]|0);if((c[Pa>>2]|0)>>>0<(c[(c[V>>2]|0)+((c[I>>2]|0)-2<<2)>>2]|0)>>>0){c[Na>>2]=(c[Na>>2]|0)+ -1;c[Ka>>2]=0-((c[Pa>>2]|0)>>>0>=(c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2]|0)>>>0);c[Pa>>2]=(c[Pa>>2]|0)-(c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2]|0);c[Na>>2]=(c[Na>>2]|0)+(c[Ka>>2]|0);c[Pa>>2]=(c[Pa>>2]|0)-(c[Ka>>2]&c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2])}c[Ua>>2]=c[(c[V>>2]|0)+((c[I>>2]|0)-2<<2)>>2];c[Va>>2]=c[Na>>2];c[Wa>>2]=c[Ua>>2]&65535;c[Xa>>2]=(c[Ua>>2]|0)>>>16;c[Ya>>2]=c[Va>>2]&65535;c[Za>>2]=(c[Va>>2]|0)>>>16;c[Ta>>2]=ea(c[Wa>>2]|0,c[Ya>>2]|0)|0;c[Ra>>2]=ea(c[Wa>>2]|0,c[Za>>2]|0)|0;c[La>>2]=ea(c[Xa>>2]|0,c[Ya>>2]|0)|0;c[Qa>>2]=ea(c[Xa>>2]|0,c[Za>>2]|0)|0;c[Ra>>2]=(c[Ra>>2]|0)+((c[Ta>>2]|0)>>>16);c[Ra>>2]=(c[Ra>>2]|0)+(c[La>>2]|0);if((c[Ra>>2]|0)>>>0<(c[La>>2]|0)>>>0){c[Qa>>2]=(c[Qa>>2]|0)+65536}c[Sa>>2]=(c[Qa>>2]|0)+((c[Ra>>2]|0)>>>16);c[Oa>>2]=(c[Ra>>2]<<16)+(c[Ta>>2]&65535);c[Pa>>2]=(c[Pa>>2]|0)+(c[Sa>>2]|0);do{if((c[Pa>>2]|0)>>>0<(c[Sa>>2]|0)>>>0?(c[Na>>2]=(c[Na>>2]|0)+ -1,(((c[Pa>>2]|0)>>>0>=(c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2]|0)>>>0|0)!=0|0)!=0):0){if(!((c[Pa>>2]|0)>>>0>(c[(c[V>>2]|0)+((c[I>>2]|0)-1<<2)>>2]|0)>>>0)?!((c[Oa>>2]|0)>>>0>=(c[(c[V>>2]|0)+((c[I>>2]|0)-2<<2)>>2]|0)>>>0):0){break}c[Na>>2]=(c[Na>>2]|0)+ -1}}while(0);c[s>>2]=c[Na>>2];if((c[I>>2]|0)<50){jg(c[m>>2]|0,c[D>>2]|0,c[I>>2]<<1,c[V>>2]|0,c[I>>2]|0,c[s>>2]|0)|0;break}if((c[I>>2]|0)<2e3){mg(c[m>>2]|0,c[D>>2]|0,c[I>>2]<<1,c[V>>2]|0,c[I>>2]|0,s)|0;break}c[sa>>2]=sg(c[I>>2]<<1,c[I>>2]|0,0)|0;s=c[sa>>2]<<2;if(((c[sa>>2]<<2>>>0<65536|0)!=0|0)!=0){Zb=i;i=i+((1*s|0)+15&-16)|0;s=Zb}else{s=Nd(p,s)|0}c[ha>>2]=s;c[ia>>2]=c[k>>2];if((c[o>>2]|0)==(c[ia>>2]|0)){c[ia>>2]=(c[ia>>2]|0)+((c[n>>2]|0)-(c[I>>2]|0)<<2)}ng(c[m>>2]|0,c[ia>>2]|0,c[D>>2]|0,c[I>>2]<<1,c[V>>2]|0,c[I>>2]|0,c[ha>>2]|0)|0;if((c[I>>2]|0)!=0){c[L>>2]=(c[I>>2]|0)-1;c[Y>>2]=c[D>>2];c[T>>2]=c[ia>>2];Zb=c[T>>2]|0;c[T>>2]=Zb+4;c[$>>2]=c[Zb>>2];if((c[L>>2]|0)!=0){do{a=c[$>>2]|0;Zb=c[Y>>2]|0;c[Y>>2]=Zb+4;c[Zb>>2]=a;Zb=c[T>>2]|0;c[T>>2]=Zb+4;c[$>>2]=c[Zb>>2];Zb=(c[L>>2]|0)+ -1|0;c[L>>2]=Zb}while((Zb|0)!=0)}a=c[$>>2]|0;Zb=c[Y>>2]|0;c[Y>>2]=Zb+4;c[Zb>>2]=a}}else{c[xa>>2]=c[c[V>>2]>>2]<<0>>>16;c[Fa>>2]=c[c[V>>2]>>2]<<0&65535;c[Da>>2]=((c[(c[D>>2]|0)+4>>2]|0)>>>0)/((c[xa>>2]|0)>>>0)|0;c[ya>>2]=(c[(c[D>>2]|0)+4>>2]|0)-(ea(c[Da>>2]|0,c[xa>>2]|0)|0);c[Ea>>2]=ea(c[Da>>2]|0,c[Fa>>2]|0)|0;c[ya>>2]=c[ya>>2]<<16|c[c[D>>2]>>2]<<0>>>16;if(((c[ya>>2]|0)>>>0<(c[Ea>>2]|0)>>>0?(c[Da>>2]=(c[Da>>2]|0)+ -1,c[ya>>2]=(c[ya>>2]|0)+(c[c[V>>2]>>2]<<0),(c[ya>>2]|0)>>>0>=c[c[V>>2]>>2]<<0>>>0):0)?(c[ya>>2]|0)>>>0<(c[Ea>>2]|0)>>>0:0){c[Da>>2]=(c[Da>>2]|0)+ -1;c[ya>>2]=(c[ya>>2]|0)+(c[c[V>>2]>>2]<<0)}c[ya>>2]=(c[ya>>2]|0)-(c[Ea>>2]|0);c[Ca>>2]=((c[ya>>2]|0)>>>0)/((c[xa>>2]|0)>>>0)|0;c[Ma>>2]=(c[ya>>2]|0)-(ea(c[Ca>>2]|0,c[xa>>2]|0)|0);c[Ea>>2]=ea(c[Ca>>2]|0,c[Fa>>2]|0)|0;c[Ma>>2]=c[Ma>>2]<<16|c[c[D>>2]>>2]<<0&65535;if(((c[Ma>>2]|0)>>>0<(c[Ea>>2]|0)>>>0?(c[Ca>>2]=(c[Ca>>2]|0)+ -1,c[Ma>>2]=(c[Ma>>2]|0)+(c[c[V>>2]>>2]<<0),(c[Ma>>2]|0)>>>0>=c[c[V>>2]>>2]<<0>>>0):0)?(c[Ma>>2]|0)>>>0<(c[Ea>>2]|0)>>>0:0){c[Ca>>2]=(c[Ca>>2]|0)+ -1;c[Ma>>2]=(c[Ma>>2]|0)+(c[c[V>>2]>>2]<<0)}c[Ma>>2]=(c[Ma>>2]|0)-(c[Ea>>2]|0);c[Ba>>2]=c[Da>>2]<<16|c[Ca>>2];c[za>>2]=c[Ma>>2];c[c[D>>2]>>2]=(c[za>>2]|0)>>>0;c[c[m>>2]>>2]=c[Ba>>2]}}while(0);c[G>>2]=c[I>>2];if(((c[H>>2]|0)-2|0)<0){c[N>>2]=0}else{c[N>>2]=c[(c[r>>2]|0)+((c[H>>2]|0)-2<<2)>>2]}c[M>>2]=c[(c[r>>2]|0)+((c[H>>2]|0)-1<<2)>>2]<<c[X>>2]|(c[N>>2]|0)>>>1>>>((~c[X>>2]>>>0)%32|0);c[ja>>2]=c[M>>2];c[ga>>2]=c[(c[m>>2]|0)+((c[I>>2]|0)-1<<2)>>2]<<0;c[fa>>2]=c[ja>>2]&65535;c[da>>2]=(c[ja>>2]|0)>>>16;c[ca>>2]=c[ga>>2]&65535;c[ba>>2]=(c[ga>>2]|0)>>>16;c[P>>2]=ea(c[fa>>2]|0,c[ca>>2]|0)|0;c[R>>2]=ea(c[fa>>2]|0,c[ba>>2]|0)|0;c[aa>>2]=ea(c[da>>2]|0,c[ca>>2]|0)|0;c[S>>2]=ea(c[da>>2]|0,c[ba>>2]|0)|0;c[R>>2]=(c[R>>2]|0)+((c[P>>2]|0)>>>16);c[R>>2]=(c[R>>2]|0)+(c[aa>>2]|0);if((c[R>>2]|0)>>>0<(c[aa>>2]|0)>>>0){c[S>>2]=(c[S>>2]|0)+65536}c[Q>>2]=(c[S>>2]|0)+((c[R>>2]|0)>>>16);c[O>>2]=(c[R>>2]<<16)+(c[P>>2]&65535);if((c[(c[D>>2]|0)+((c[I>>2]|0)-1<<2)>>2]|0)>>>0<(c[Q>>2]|0)>>>0){c[U>>2]=c[m>>2];do{a=c[U>>2]|0;c[U>>2]=a+4;Zb=c[a>>2]|0;c[a>>2]=Zb+ -1}while((Zb|0)==0);c[W>>2]=qe(c[D>>2]|0,c[D>>2]|0,c[V>>2]|0,c[I>>2]|0)|0;if((c[W>>2]|0)!=0){c[(c[D>>2]|0)+(c[I>>2]<<2)>>2]=c[W>>2];c[G>>2]=(c[G>>2]|0)+1}}c[A>>2]=0;if((c[X>>2]|0)!=0){c[Z>>2]=xe(c[D>>2]|0,c[D>>2]|0,c[G>>2]|0,32-(c[X>>2]|0)|0)|0;Zb=c[D>>2]|0;c[Zb>>2]=c[Zb>>2]|c[(c[o>>2]|0)+((c[H>>2]|0)-1<<2)>>2]&-1>>>(c[X>>2]|0);c[_>>2]=we(c[D>>2]|0,c[m>>2]|0,c[I>>2]|0,c[(c[r>>2]|0)+((c[H>>2]|0)-1<<2)>>2]&-1>>>(c[X>>2]|0))|0;do{if((c[I>>2]|0)!=(c[G>>2]|0)){if(((((c[(c[D>>2]|0)+(c[I>>2]<<2)>>2]|0)>>>0>=(c[_>>2]|0)>>>0^1)&1|0)!=0|0)!=0){Hd(13792,343,13864)}else{Zb=(c[D>>2]|0)+(c[I>>2]<<2)|0;c[Zb>>2]=(c[Zb>>2]|0)-(c[_>>2]|0);break}}else{c[(c[D>>2]|0)+(c[I>>2]<<2)>>2]=(c[Z>>2]|0)-(c[_>>2]|0);c[A>>2]=(c[Z>>2]|0)>>>0<(c[_>>2]|0)>>>0;c[G>>2]=(c[G>>2]|0)+1}}while(0);c[H>>2]=(c[H>>2]|0)+ -1}n=c[q>>2]<<2;if(((c[q>>2]<<2>>>0<65536|0)!=0|0)!=0){Zb=i;i=i+((1*n|0)+15&-16)|0;n=Zb}else{n=Nd(p,n)|0}c[J>>2]=n;do{if((c[H>>2]|0)<(c[I>>2]|0)){if((c[H>>2]|0)!=0){De(c[J>>2]|0,c[m>>2]|0,c[I>>2]|0,c[r>>2]|0,c[H>>2]|0)|0;K=182;break}if((c[G>>2]|0)!=0){c[F>>2]=(c[G>>2]|0)-1;c[E>>2]=c[k>>2];c[u>>2]=c[D>>2];Zb=c[u>>2]|0;c[u>>2]=Zb+4;c[B>>2]=c[Zb>>2];if((c[F>>2]|0)!=0){do{a=c[B>>2]|0;Zb=c[E>>2]|0;c[E>>2]=Zb+4;c[Zb>>2]=a;Zb=c[u>>2]|0;c[u>>2]=Zb+4;c[B>>2]=c[Zb>>2];Zb=(c[F>>2]|0)+ -1|0;c[F>>2]=Zb}while((Zb|0)!=0)}a=c[B>>2]|0;Zb=c[E>>2]|0;c[E>>2]=Zb+4;c[Zb>>2]=a}if(((((c[G>>2]|0)==(c[q>>2]|0)^1)&1|0)!=0|0)!=0){Hd(13792,364,13880)}}else{De(c[J>>2]|0,c[r>>2]|0,c[H>>2]|0,c[m>>2]|0,c[I>>2]|0)|0;K=182}}while(0);if((K|0)==182){c[v>>2]=re(c[D>>2]|0,c[D>>2]|0,c[G>>2]|0,(c[J>>2]|0)+(c[H>>2]<<2)|0,c[I>>2]|0)|0;if(((c[q>>2]|0)-(c[H>>2]|0)|0)!=0){c[y>>2]=(c[q>>2]|0)-(c[H>>2]|0)-1;c[w>>2]=(c[k>>2]|0)+(c[H>>2]<<2);c[x>>2]=c[D>>2];Zb=c[x>>2]|0;c[x>>2]=Zb+4;c[C>>2]=c[Zb>>2];if((c[y>>2]|0)!=0){do{a=c[C>>2]|0;Zb=c[w>>2]|0;c[w>>2]=Zb+4;c[Zb>>2]=a;Zb=c[x>>2]|0;c[x>>2]=Zb+4;c[C>>2]=c[Zb>>2];Zb=(c[y>>2]|0)+ -1|0;c[y>>2]=Zb}while((Zb|0)!=0)}a=c[C>>2]|0;Zb=c[w>>2]|0;c[w>>2]=Zb+4;c[Zb>>2]=a}c[A>>2]=c[A>>2]|c[v>>2];c[v>>2]=te(c[k>>2]|0,c[o>>2]|0,c[J>>2]|0,c[H>>2]|0)|0;c[v>>2]=se((c[k>>2]|0)+(c[H>>2]<<2)|0,(c[k>>2]|0)+(c[H>>2]<<2)|0,c[G>>2]|0,c[v>>2]|0)|0;c[A>>2]=c[A>>2]|c[v>>2]}if((c[A>>2]|0)!=0){c[z>>2]=c[m>>2];do{a=c[z>>2]|0;c[z>>2]=a+4;Zb=c[a>>2]|0;c[a>>2]=Zb+ -1}while((Zb|0)==0);qe(c[k>>2]|0,c[k>>2]|0,c[r>>2]|0,c[q>>2]|0)|0}if((((c[p>>2]|0)!=0|0)!=0|0)==0){i=l;return}Od(c[p>>2]|0);i=l;return}}function hf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;l=i;i=i+96|0;n=l+92|0;x=l+88|0;F=l+84|0;w=l+80|0;E=l+76|0;t=l+72|0;s=l+64|0;v=l+60|0;u=l+56|0;q=l+52|0;m=l+48|0;o=l+44|0;z=l+40|0;y=l+36|0;C=l+32|0;D=l+28|0;A=l+24|0;B=l+20|0;r=l+16|0;p=l+12|0;j=l+8|0;k=l+4|0;h=l;c[n>>2]=a;c[x>>2]=b;c[F>>2]=d;c[w>>2]=e;c[E>>2]=f;c[t>>2]=g;c[l+68>>2]=1;c[v>>2]=c[F>>2]>>1;c[s>>2]=(c[F>>2]|0)-(c[v>>2]|0);c[u>>2]=(c[E>>2]|0)-(c[s>>2]|0);c[z>>2]=c[n>>2];c[y>>2]=(c[n>>2]|0)+(c[s>>2]<<2);c[q>>2]=0;f=c[x>>2]|0;do{if((c[v>>2]|0)==(c[s>>2]|0)){F=(ff(f,(c[x>>2]|0)+(c[s>>2]<<2)|0,c[s>>2]|0)|0)<0;C=c[z>>2]|0;D=c[x>>2]|0;if(F){te(C,D+(c[s>>2]<<2)|0,c[x>>2]|0,c[s>>2]|0)|0;c[q>>2]=1;break}else{te(C,D,(c[x>>2]|0)+(c[s>>2]<<2)|0,c[s>>2]|0)|0;break}}else{if((jf(f+(c[v>>2]<<2)|0,(c[s>>2]|0)-(c[v>>2]|0)|0)|0)!=0?(ff(c[x>>2]|0,(c[x>>2]|0)+(c[s>>2]<<2)|0,c[v>>2]|0)|0)<0:0){te(c[z>>2]|0,(c[x>>2]|0)+(c[s>>2]<<2)|0,c[x>>2]|0,c[v>>2]|0)|0;if(((c[s>>2]|0)-(c[v>>2]|0)|0)!=0){c[C>>2]=(c[z>>2]|0)+(c[v>>2]<<2);c[D>>2]=(c[s>>2]|0)-(c[v>>2]|0);do{F=c[C>>2]|0;c[C>>2]=F+4;c[F>>2]=0;F=(c[D>>2]|0)+ -1|0;c[D>>2]=F}while((F|0)!=0)}c[q>>2]=1;break}re(c[z>>2]|0,c[x>>2]|0,c[s>>2]|0,(c[x>>2]|0)+(c[s>>2]<<2)|0,c[v>>2]|0)|0}}while(0);C=c[w>>2]|0;do{if((c[u>>2]|0)==(c[s>>2]|0)){F=(ff(C,(c[w>>2]|0)+(c[s>>2]<<2)|0,c[s>>2]|0)|0)<0;B=c[y>>2]|0;A=c[w>>2]|0;if(F){te(B,A+(c[s>>2]<<2)|0,c[w>>2]|0,c[s>>2]|0)|0;c[q>>2]=c[q>>2]^1;break}else{te(B,A,(c[w>>2]|0)+(c[s>>2]<<2)|0,c[s>>2]|0)|0;break}}else{if((jf(C+(c[u>>2]<<2)|0,(c[s>>2]|0)-(c[u>>2]|0)|0)|0)!=0?(ff(c[w>>2]|0,(c[w>>2]|0)+(c[s>>2]<<2)|0,c[u>>2]|0)|0)<0:0){te(c[y>>2]|0,(c[w>>2]|0)+(c[s>>2]<<2)|0,c[w>>2]|0,c[u>>2]|0)|0;if(((c[s>>2]|0)-(c[u>>2]|0)|0)!=0){c[A>>2]=(c[y>>2]|0)+(c[u>>2]<<2);c[B>>2]=(c[s>>2]|0)-(c[u>>2]|0);do{F=c[A>>2]|0;c[A>>2]=F+4;c[F>>2]=0;F=(c[B>>2]|0)+ -1|0;c[B>>2]=F}while((F|0)!=0)}c[q>>2]=c[q>>2]^1;break}re(c[y>>2]|0,c[w>>2]|0,c[s>>2]|0,(c[w>>2]|0)+(c[s>>2]<<2)|0,c[u>>2]|0)|0}}while(0);A=c[t>>2]|0;B=c[z>>2]|0;z=c[s>>2]|0;C=c[y>>2]|0;y=c[s>>2]|0;if((c[s>>2]|0)>=30){hf(A,B,z,C,y,(c[t>>2]|0)+(c[s>>2]<<1<<2)|0)}else{Ye(A,B,z,C,y)}do{if((c[v>>2]|0)>(c[u>>2]|0)){if((c[u>>2]|0)<30){Ye((c[n>>2]|0)+(c[s>>2]<<1<<2)|0,(c[x>>2]|0)+(c[s>>2]<<2)|0,c[v>>2]|0,(c[w>>2]|0)+(c[s>>2]<<2)|0,c[u>>2]|0);break}y=(c[n>>2]|0)+(c[s>>2]<<1<<2)|0;z=(c[x>>2]|0)+(c[s>>2]<<2)|0;A=c[v>>2]|0;B=(c[w>>2]|0)+(c[s>>2]<<2)|0;C=c[u>>2]|0;D=(c[t>>2]|0)+(c[s>>2]<<1<<2)|0;if((c[v>>2]<<2|0)<((c[u>>2]|0)*5|0)){hf(y,z,A,B,C,D);break}else{kf(y,z,A,B,C,D);break}}else{C=(c[n>>2]|0)+(c[s>>2]<<1<<2)|0;y=(c[x>>2]|0)+(c[s>>2]<<2)|0;B=c[v>>2]|0;A=(c[w>>2]|0)+(c[s>>2]<<2)|0;z=c[v>>2]|0;if((c[v>>2]|0)>=30){hf(C,y,B,A,z,(c[t>>2]|0)+(c[s>>2]<<1<<2)|0);break}else{Ye(C,y,B,A,z);break}}}while(0);y=c[n>>2]|0;z=c[x>>2]|0;x=c[s>>2]|0;A=c[w>>2]|0;w=c[s>>2]|0;if((c[s>>2]|0)>=30){hf(y,z,x,A,w,(c[t>>2]|0)+(c[s>>2]<<1<<2)|0)}else{Ye(y,z,x,A,w)}c[m>>2]=qe((c[n>>2]|0)+(c[s>>2]<<1<<2)|0,(c[n>>2]|0)+(c[s>>2]<<2)|0,(c[n>>2]|0)+(c[s>>2]<<1<<2)|0,c[s>>2]|0)|0;w=c[m>>2]|0;c[o>>2]=w+(qe((c[n>>2]|0)+(c[s>>2]<<2)|0,(c[n>>2]|0)+(c[s>>2]<<1<<2)|0,c[n>>2]|0,c[s>>2]|0)|0);v=oe((c[n>>2]|0)+(c[s>>2]<<1<<2)|0,(c[n>>2]|0)+(c[s>>2]<<1<<2)|0,c[s>>2]|0,(c[n>>2]|0)+(c[s>>2]<<1<<2)+(c[s>>2]<<2)|0,(c[v>>2]|0)+(c[u>>2]|0)-(c[s>>2]|0)|0)|0;c[m>>2]=(c[m>>2]|0)+v;v=(c[n>>2]|0)+(c[s>>2]<<2)|0;u=(c[n>>2]|0)+(c[s>>2]<<2)|0;w=c[t>>2]|0;t=c[s>>2]<<1;if((c[q>>2]|0)!=0){F=qe(v,u,w,t)|0;c[m>>2]=(c[m>>2]|0)+F}else{F=te(v,u,w,t)|0;c[m>>2]=(c[m>>2]|0)-F}c[p>>2]=(c[n>>2]|0)+(c[s>>2]<<1<<2);c[r>>2]=(c[c[p>>2]>>2]|0)+(c[o>>2]|0);c[c[p>>2]>>2]=c[r>>2];if((c[r>>2]|0)>>>0<(c[o>>2]|0)>>>0){do{E=(c[p>>2]|0)+4|0;c[p>>2]=E;F=(c[E>>2]|0)+1|0;c[E>>2]=F}while((F|0)==0)}n=(c[n>>2]|0)+((c[s>>2]|0)*3<<2)|0;if((((c[m>>2]|0)>>>0<=2|0)!=0|0)==0){c[h>>2]=n;do{E=c[h>>2]|0;c[h>>2]=E+4;F=c[E>>2]|0;c[E>>2]=F+ -1}while((F|0)==0);i=l;return}c[k>>2]=n;c[j>>2]=(c[c[k>>2]>>2]|0)+(c[m>>2]|0);c[c[k>>2]>>2]=c[j>>2];if(!((c[j>>2]|0)>>>0<(c[m>>2]|0)>>>0)){i=l;return}do{E=(c[k>>2]|0)+4|0;c[k>>2]=E;F=(c[E>>2]|0)+1|0;c[E>>2]=F}while((F|0)==0);i=l;return}function jf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;e=i;i=i+16|0;d=e+8|0;f=e+4|0;g=e;c[f>>2]=a;c[g>>2]=b;while(1){a=(c[g>>2]|0)+ -1|0;c[g>>2]=a;if((a|0)<0){b=5;break}if((c[(c[f>>2]|0)+(c[g>>2]<<2)>>2]|0)!=0){b=4;break}}if((b|0)==4){c[d>>2]=0;a=c[d>>2]|0;i=e;return a|0}else if((b|0)==5){c[d>>2]=1;a=c[d>>2]|0;i=e;return a|0}return 0}function kf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;n=i;i=i+112|0;v=n+100|0;t=n+96|0;H=n+92|0;u=n+88|0;I=n+84|0;q=n+80|0;r=n+76|0;p=n+72|0;s=n+68|0;w=n+64|0;o=n+60|0;j=n+56|0;E=n+52|0;D=n+48|0;F=n+44|0;G=n+40|0;C=n+36|0;B=n+32|0;z=n+28|0;A=n+24|0;x=n+20|0;y=n+16|0;l=n+12|0;m=n+8|0;k=n+4|0;h=n;c[v>>2]=a;c[t>>2]=b;c[H>>2]=d;c[u>>2]=e;c[I>>2]=f;c[q>>2]=g;if((c[H>>2]<<1|0)>=((c[I>>2]|0)*3|0)){g=(((c[H>>2]|0)-1|0)>>>0)/3|0}else{g=(c[I>>2]|0)-1>>1}c[r>>2]=1+g;c[p>>2]=(c[H>>2]|0)-(c[r>>2]<<1);c[s>>2]=(c[I>>2]|0)-(c[r>>2]|0);c[E>>2]=oe(c[v>>2]|0,c[t>>2]|0,c[r>>2]|0,(c[t>>2]|0)+(c[r>>2]<<1<<2)|0,c[p>>2]|0)|0;if((c[E>>2]|0)==0?(ff(c[v>>2]|0,(c[t>>2]|0)+(c[r>>2]<<2)|0,c[r>>2]|0)|0)<0:0){te((c[v>>2]|0)+(c[r>>2]<<1<<2)|0,(c[t>>2]|0)+(c[r>>2]<<2)|0,c[v>>2]|0,c[r>>2]|0)|0;c[j>>2]=0;c[w>>2]=1}else{a=c[E>>2]|0;c[j>>2]=a-(te((c[v>>2]|0)+(c[r>>2]<<1<<2)|0,c[v>>2]|0,(c[t>>2]|0)+(c[r>>2]<<2)|0,c[r>>2]|0)|0);c[w>>2]=0}H=qe(c[v>>2]|0,c[v>>2]|0,(c[t>>2]|0)+(c[r>>2]<<2)|0,c[r>>2]|0)|0;c[E>>2]=(c[E>>2]|0)+H;H=(c[v>>2]|0)+(c[r>>2]<<2)|0;I=c[u>>2]|0;do{if((c[s>>2]|0)==(c[r>>2]|0)){c[D>>2]=qe(H,I,(c[u>>2]|0)+(c[r>>2]<<2)|0,c[r>>2]|0)|0;a=(ff(c[u>>2]|0,(c[u>>2]|0)+(c[r>>2]<<2)|0,c[r>>2]|0)|0)<0;G=(c[v>>2]|0)+((c[r>>2]|0)*3<<2)|0;F=c[u>>2]|0;if(a){te(G,F+(c[r>>2]<<2)|0,c[u>>2]|0,c[r>>2]|0)|0;c[w>>2]=c[w>>2]^1;break}else{te(G,F,(c[u>>2]|0)+(c[r>>2]<<2)|0,c[r>>2]|0)|0;break}}else{c[D>>2]=oe(H,I,c[r>>2]|0,(c[u>>2]|0)+(c[r>>2]<<2)|0,c[s>>2]|0)|0;if((lf((c[u>>2]|0)+(c[s>>2]<<2)|0,(c[r>>2]|0)-(c[s>>2]|0)|0)|0)!=0?(ff(c[u>>2]|0,(c[u>>2]|0)+(c[r>>2]<<2)|0,c[s>>2]|0)|0)<0:0){te((c[v>>2]|0)+((c[r>>2]|0)*3<<2)|0,(c[u>>2]|0)+(c[r>>2]<<2)|0,c[u>>2]|0,c[s>>2]|0)|0;if(((c[r>>2]|0)-(c[s>>2]|0)|0)!=0){c[F>>2]=(c[v>>2]|0)+((c[r>>2]|0)*3<<2)+(c[s>>2]<<2);c[G>>2]=(c[r>>2]|0)-(c[s>>2]|0);do{a=c[F>>2]|0;c[F>>2]=a+4;c[a>>2]=0;a=(c[G>>2]|0)+ -1|0;c[G>>2]=a}while((a|0)!=0)}c[w>>2]=c[w>>2]^1;break}re((c[v>>2]|0)+((c[r>>2]|0)*3<<2)|0,c[u>>2]|0,c[r>>2]|0,(c[u>>2]|0)+(c[r>>2]<<2)|0,c[s>>2]|0)|0}}while(0);We(c[q>>2]|0,c[v>>2]|0,(c[v>>2]|0)+(c[r>>2]<<2)|0,c[r>>2]|0);do{if((c[E>>2]|0)!=1){if((c[E>>2]|0)==2){a=c[D>>2]<<1;c[o>>2]=a+(ve((c[q>>2]|0)+(c[r>>2]<<2)|0,(c[v>>2]|0)+(c[r>>2]<<2)|0,c[r>>2]|0,2)|0);break}else{c[o>>2]=0;break}}else{a=c[D>>2]|0;c[o>>2]=a+(qe((c[q>>2]|0)+(c[r>>2]<<2)|0,(c[q>>2]|0)+(c[r>>2]<<2)|0,(c[v>>2]|0)+(c[r>>2]<<2)|0,c[r>>2]|0)|0)}}while(0);if((c[D>>2]|0)!=0){a=qe((c[q>>2]|0)+(c[r>>2]<<2)|0,(c[q>>2]|0)+(c[r>>2]<<2)|0,c[v>>2]|0,c[r>>2]|0)|0;c[o>>2]=(c[o>>2]|0)+a}c[(c[q>>2]|0)+(c[r>>2]<<1<<2)>>2]=c[o>>2];We(c[v>>2]|0,(c[v>>2]|0)+(c[r>>2]<<1<<2)|0,(c[v>>2]|0)+((c[r>>2]|0)*3<<2)|0,c[r>>2]|0);if((c[j>>2]|0)!=0){c[j>>2]=qe((c[v>>2]|0)+(c[r>>2]<<2)|0,(c[v>>2]|0)+(c[r>>2]<<2)|0,(c[v>>2]|0)+((c[r>>2]|0)*3<<2)|0,c[r>>2]|0)|0}c[(c[v>>2]|0)+(c[r>>2]<<1<<2)>>2]=c[j>>2];G=c[q>>2]|0;F=c[q>>2]|0;E=c[v>>2]|0;D=(c[r>>2]<<1)+1|0;if((c[w>>2]|0)!=0){te(G,F,E,D)|0;ye(c[q>>2]|0,c[q>>2]|0,(c[r>>2]<<1)+1|0,1)|0}else{qe(G,F,E,D)|0;ye(c[q>>2]|0,c[q>>2]|0,(c[r>>2]<<1)+1|0,1)|0}c[j>>2]=c[(c[v>>2]|0)+(c[r>>2]<<1<<2)>>2];c[o>>2]=qe((c[v>>2]|0)+(c[r>>2]<<1<<2)|0,c[q>>2]|0,(c[q>>2]|0)+(c[r>>2]<<2)|0,c[r>>2]|0)|0;c[B>>2]=(c[q>>2]|0)+(c[r>>2]<<2);c[C>>2]=(c[c[B>>2]>>2]|0)+((c[o>>2]|0)+(c[(c[q>>2]|0)+(c[r>>2]<<1<<2)>>2]|0));c[c[B>>2]>>2]=c[C>>2];if((c[C>>2]|0)>>>0<((c[o>>2]|0)+(c[(c[q>>2]|0)+(c[r>>2]<<1<<2)>>2]|0)|0)>>>0){do{b=(c[B>>2]|0)+4|0;c[B>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}E=c[q>>2]|0;D=c[q>>2]|0;C=c[v>>2]|0;B=c[r>>2]|0;if((c[w>>2]|0)!=0){c[o>>2]=qe(E,D,C,B)|0;a=mf((c[v>>2]|0)+(c[r>>2]<<1<<2)|0,(c[v>>2]|0)+(c[r>>2]<<1<<2)|0,(c[v>>2]|0)+(c[r>>2]<<2)|0,c[r>>2]|0,c[o>>2]|0)|0;c[j>>2]=(c[j>>2]|0)+a;c[A>>2]=(c[q>>2]|0)+(c[r>>2]<<2);c[z>>2]=(c[c[A>>2]>>2]|0)+(c[j>>2]|0);c[c[A>>2]>>2]=c[z>>2];if((c[z>>2]|0)>>>0<(c[j>>2]|0)>>>0){do{b=(c[A>>2]|0)+4|0;c[A>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}}else{c[o>>2]=te(E,D,C,B)|0;a=nf((c[v>>2]|0)+(c[r>>2]<<1<<2)|0,(c[v>>2]|0)+(c[r>>2]<<1<<2)|0,(c[v>>2]|0)+(c[r>>2]<<2)|0,c[r>>2]|0,c[o>>2]|0)|0;c[j>>2]=(c[j>>2]|0)+a;c[y>>2]=(c[q>>2]|0)+(c[r>>2]<<2);c[x>>2]=c[c[y>>2]>>2];c[c[y>>2]>>2]=(c[x>>2]|0)-(c[j>>2]|0);if((c[x>>2]|0)>>>0<(c[j>>2]|0)>>>0){do{b=(c[y>>2]|0)+4|0;c[y>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}}We(c[v>>2]|0,c[t>>2]|0,c[u>>2]|0,c[r>>2]|0);w=(c[v>>2]|0)+((c[r>>2]|0)*3<<2)|0;if((c[p>>2]|0)>(c[s>>2]|0)){De(w,(c[t>>2]|0)+(c[r>>2]<<1<<2)|0,c[p>>2]|0,(c[u>>2]|0)+(c[r>>2]<<2)|0,c[s>>2]|0)|0}else{De(w,(c[u>>2]|0)+(c[r>>2]<<2)|0,c[s>>2]|0,(c[t>>2]|0)+(c[r>>2]<<1<<2)|0,c[p>>2]|0)|0}c[o>>2]=te((c[v>>2]|0)+(c[r>>2]<<2)|0,(c[v>>2]|0)+(c[r>>2]<<2)|0,(c[v>>2]|0)+((c[r>>2]|0)*3<<2)|0,c[r>>2]|0)|0;c[j>>2]=(c[(c[q>>2]|0)+(c[r>>2]<<1<<2)>>2]|0)+(c[o>>2]|0);c[o>>2]=nf((c[v>>2]|0)+(c[r>>2]<<1<<2)|0,(c[v>>2]|0)+(c[r>>2]<<1<<2)|0,c[v>>2]|0,c[r>>2]|0,c[o>>2]|0)|0;a=nf((c[v>>2]|0)+((c[r>>2]|0)*3<<2)|0,(c[q>>2]|0)+(c[r>>2]<<2)|0,(c[v>>2]|0)+(c[r>>2]<<2)|0,c[r>>2]|0,c[o>>2]|0)|0;c[j>>2]=(c[j>>2]|0)-a;a=oe((c[v>>2]|0)+(c[r>>2]<<2)|0,(c[v>>2]|0)+(c[r>>2]<<2)|0,(c[r>>2]|0)*3|0,c[q>>2]|0,c[r>>2]|0)|0;c[j>>2]=(c[j>>2]|0)+a;if(((((c[p>>2]|0)+(c[s>>2]|0)|0)>(c[r>>2]|0)|0)!=0|0)==0){i=n;return}o=re((c[v>>2]|0)+(c[r>>2]<<1<<2)|0,(c[v>>2]|0)+(c[r>>2]<<1<<2)|0,c[r>>2]<<1,(c[v>>2]|0)+(c[r>>2]<<2<<2)|0,(c[p>>2]|0)+(c[s>>2]|0)-(c[r>>2]|0)|0)|0;c[j>>2]=(c[j>>2]|0)-o;o=(c[v>>2]|0)+(c[r>>2]<<2<<2)|0;if((c[j>>2]|0)<0){c[m>>2]=o;c[l>>2]=c[c[m>>2]>>2];c[c[m>>2]>>2]=(c[l>>2]|0)-(0-(c[j>>2]|0));if(!((c[l>>2]|0)>>>0<(0-(c[j>>2]|0)|0)>>>0)){i=n;return}do{b=(c[m>>2]|0)+4|0;c[m>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0);i=n;return}else{c[h>>2]=o;c[k>>2]=(c[c[h>>2]>>2]|0)+(c[j>>2]|0);c[c[h>>2]>>2]=c[k>>2];if(!((c[k>>2]|0)>>>0<(c[j>>2]|0)>>>0)){i=n;return}do{b=(c[h>>2]|0)+4|0;c[h>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0);i=n;return}}function lf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;e=i;i=i+16|0;d=e+8|0;f=e+4|0;g=e;c[f>>2]=a;c[g>>2]=b;while(1){a=(c[g>>2]|0)+ -1|0;c[g>>2]=a;if((a|0)<0){b=5;break}if((c[(c[f>>2]|0)+(c[g>>2]<<2)>>2]|0)!=0){b=4;break}}if((b|0)==4){c[d>>2]=0;a=c[d>>2]|0;i=e;return a|0}else if((b|0)==5){c[d>>2]=1;a=c[d>>2]|0;i=e;return a|0}return 0}function mf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+32|0;l=h+20|0;n=h+16|0;m=h+12|0;k=h+8|0;j=h+4|0;g=h;c[l>>2]=a;c[n>>2]=b;c[m>>2]=d;c[k>>2]=e;c[j>>2]=f;c[g>>2]=qe(c[l>>2]|0,c[n>>2]|0,c[m>>2]|0,c[k>>2]|0)|0;a=pe(c[l>>2]|0,c[l>>2]|0,c[k>>2]|0,c[j>>2]|0)|0;c[g>>2]=(c[g>>2]|0)+a;i=h;return c[g>>2]|0}function nf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+32|0;l=h+20|0;n=h+16|0;m=h+12|0;k=h+8|0;j=h+4|0;g=h;c[l>>2]=a;c[n>>2]=b;c[m>>2]=d;c[k>>2]=e;c[j>>2]=f;c[g>>2]=te(c[l>>2]|0,c[n>>2]|0,c[m>>2]|0,c[k>>2]|0)|0;a=se(c[l>>2]|0,c[l>>2]|0,c[k>>2]|0,c[j>>2]|0)|0;c[g>>2]=(c[g>>2]|0)+a;i=h;return c[g>>2]|0}function of(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;v=i;i=i+96|0;u=v+84|0;m=v+80|0;C=v+76|0;n=v+72|0;D=v+68|0;o=v+64|0;s=v+60|0;p=v+56|0;q=v+52|0;h=v+48|0;k=v+44|0;j=v+40|0;E=v+36|0;r=v+32|0;y=v+28|0;z=v+24|0;l=v+20|0;x=v+16|0;w=v+12|0;t=v+8|0;B=v+4|0;A=v;c[u>>2]=a;c[m>>2]=b;c[C>>2]=d;c[n>>2]=e;c[D>>2]=f;c[o>>2]=g;if((c[C>>2]|0)>=(c[D>>2]<<1|0)){g=(c[C>>2]|0)+3>>2}else{g=(c[D>>2]|0)+1>>1}c[s>>2]=g;c[p>>2]=(c[C>>2]|0)-((c[s>>2]|0)*3|0);c[q>>2]=(c[D>>2]|0)-(c[s>>2]|0);c[t>>2]=0;a=i;i=i+((1*((c[s>>2]|0)+1<<2)|0)+15&-16)|0;c[r>>2]=a;a=i;i=i+((1*((c[s>>2]|0)+1<<2)|0)+15&-16)|0;c[y>>2]=a;a=i;i=i+((1*((c[s>>2]|0)+1<<2)|0)+15&-16)|0;c[z>>2]=a;a=i;i=i+((1*((c[s>>2]|0)+1<<2)|0)+15&-16)|0;c[l>>2]=a;a=i;i=i+((1*(c[s>>2]<<2)|0)+15&-16)|0;c[x>>2]=a;a=i;i=i+((1*((c[s>>2]|0)+1<<2)|0)+15&-16)|0;c[w>>2]=a;c[E>>2]=c[u>>2];c[h>>2]=(Gf(c[r>>2]|0,c[y>>2]|0,c[m>>2]|0,c[s>>2]|0,c[p>>2]|0,c[E>>2]|0)|0)&1;c[k>>2]=xe(c[z>>2]|0,(c[m>>2]|0)+((c[s>>2]|0)*3<<2)|0,c[p>>2]|0,1)|0;a=qe(c[z>>2]|0,(c[m>>2]|0)+(c[s>>2]<<1<<2)|0,c[z>>2]|0,c[p>>2]|0)|0;c[k>>2]=(c[k>>2]|0)+a;if((c[p>>2]|0)!=(c[s>>2]|0)){c[k>>2]=pe((c[z>>2]|0)+(c[p>>2]<<2)|0,(c[m>>2]|0)+(c[s>>2]<<1<<2)+(c[p>>2]<<2)|0,(c[s>>2]|0)-(c[p>>2]|0)|0,c[k>>2]|0)|0}D=c[k>>2]<<1;c[k>>2]=D+(xe(c[z>>2]|0,c[z>>2]|0,c[s>>2]|0,1)|0);D=qe(c[z>>2]|0,(c[m>>2]|0)+(c[s>>2]<<2)|0,c[z>>2]|0,c[s>>2]|0)|0;c[k>>2]=(c[k>>2]|0)+D;D=c[k>>2]<<1;c[k>>2]=D+(xe(c[z>>2]|0,c[z>>2]|0,c[s>>2]|0,1)|0);D=qe(c[z>>2]|0,c[m>>2]|0,c[z>>2]|0,c[s>>2]|0)|0;c[k>>2]=(c[k>>2]|0)+D;c[(c[z>>2]|0)+(c[s>>2]<<2)>>2]=c[k>>2];D=c[l>>2]|0;C=c[n>>2]|0;do{if((c[q>>2]|0)==(c[s>>2]|0)){a=qe(D,C,(c[n>>2]|0)+(c[s>>2]<<2)|0,c[s>>2]|0)|0;c[(c[l>>2]|0)+(c[s>>2]<<2)>>2]=a;a=(ff(c[n>>2]|0,(c[n>>2]|0)+(c[s>>2]<<2)|0,c[s>>2]|0)|0)<0;B=c[x>>2]|0;A=c[n>>2]|0;if(a){te(B,A+(c[s>>2]<<2)|0,c[n>>2]|0,c[s>>2]|0)|0;c[h>>2]=c[h>>2]^1;break}else{te(B,A,(c[n>>2]|0)+(c[s>>2]<<2)|0,c[s>>2]|0)|0;break}}else{a=oe(D,C,c[s>>2]|0,(c[n>>2]|0)+(c[s>>2]<<2)|0,c[q>>2]|0)|0;c[(c[l>>2]|0)+(c[s>>2]<<2)>>2]=a;if((pf((c[n>>2]|0)+(c[q>>2]<<2)|0,(c[s>>2]|0)-(c[q>>2]|0)|0)|0)!=0?(ff(c[n>>2]|0,(c[n>>2]|0)+(c[s>>2]<<2)|0,c[q>>2]|0)|0)<0:0){te(c[x>>2]|0,(c[n>>2]|0)+(c[s>>2]<<2)|0,c[n>>2]|0,c[q>>2]|0)|0;if(((c[s>>2]|0)-(c[q>>2]|0)|0)!=0){c[B>>2]=(c[x>>2]|0)+(c[q>>2]<<2);c[A>>2]=(c[s>>2]|0)-(c[q>>2]|0);do{a=c[B>>2]|0;c[B>>2]=a+4;c[a>>2]=0;a=(c[A>>2]|0)+ -1|0;c[A>>2]=a}while((a|0)!=0)}c[h>>2]=c[h>>2]^1;break}re(c[x>>2]|0,c[n>>2]|0,c[s>>2]|0,(c[n>>2]|0)+(c[s>>2]<<2)|0,c[q>>2]|0)|0}}while(0);oe(c[w>>2]|0,c[l>>2]|0,(c[s>>2]|0)+1|0,(c[n>>2]|0)+(c[s>>2]<<2)|0,c[q>>2]|0)|0;We(c[o>>2]|0,c[y>>2]|0,c[x>>2]|0,c[s>>2]|0);c[k>>2]=0;if((c[(c[y>>2]|0)+(c[s>>2]<<2)>>2]|0)!=0){c[k>>2]=qe((c[o>>2]|0)+(c[s>>2]<<2)|0,(c[o>>2]|0)+(c[s>>2]<<2)|0,c[x>>2]|0,c[s>>2]|0)|0}c[(c[o>>2]|0)+(c[s>>2]<<1<<2)>>2]=c[k>>2];We((c[o>>2]|0)+(c[s>>2]<<1<<2)+4|0,c[z>>2]|0,c[w>>2]|0,(c[s>>2]|0)+1|0);w=(c[u>>2]|0)+(c[s>>2]<<2<<2)|0;if((c[p>>2]|0)>(c[q>>2]|0)){De(w,(c[m>>2]|0)+((c[s>>2]|0)*3<<2)|0,c[p>>2]|0,(c[n>>2]|0)+(c[s>>2]<<2)|0,c[q>>2]|0)|0}else{De(w,(c[n>>2]|0)+(c[s>>2]<<2)|0,c[q>>2]|0,(c[m>>2]|0)+((c[s>>2]|0)*3<<2)|0,c[p>>2]|0)|0}c[j>>2]=c[(c[u>>2]|0)+(c[s>>2]<<2<<2)>>2];We((c[u>>2]|0)+(c[s>>2]<<1<<2)|0,c[r>>2]|0,c[l>>2]|0,c[s>>2]|0);w=c[s>>2]|0;do{if((c[(c[r>>2]|0)+(c[s>>2]<<2)>>2]|0)!=1){x=c[s>>2]|0;if((c[(c[r>>2]|0)+(w<<2)>>2]|0)==2){a=c[(c[l>>2]|0)+(x<<2)>>2]<<1;c[k>>2]=a+(ve((c[u>>2]|0)+(c[s>>2]<<1<<2)+(c[s>>2]<<2)|0,c[l>>2]|0,c[s>>2]|0,2)|0);break}if((c[(c[r>>2]|0)+(x<<2)>>2]|0)==3){a=(c[(c[l>>2]|0)+(c[s>>2]<<2)>>2]|0)*3|0;c[k>>2]=a+(ve((c[u>>2]|0)+(c[s>>2]<<1<<2)+(c[s>>2]<<2)|0,c[l>>2]|0,c[s>>2]|0,3)|0);break}else{c[k>>2]=0;break}}else{a=c[(c[l>>2]|0)+(w<<2)>>2]|0;c[k>>2]=a+(qe((c[u>>2]|0)+(c[s>>2]<<1<<2)+(c[s>>2]<<2)|0,(c[u>>2]|0)+(c[s>>2]<<1<<2)+(c[s>>2]<<2)|0,c[l>>2]|0,c[s>>2]|0)|0)}}while(0);if((c[(c[l>>2]|0)+(c[s>>2]<<2)>>2]|0)!=0){a=qe((c[u>>2]|0)+(c[s>>2]<<1<<2)+(c[s>>2]<<2)|0,(c[u>>2]|0)+(c[s>>2]<<1<<2)+(c[s>>2]<<2)|0,c[r>>2]|0,c[s>>2]|0)|0;c[k>>2]=(c[k>>2]|0)+a}c[(c[u>>2]|0)+(c[s>>2]<<1<<2)+(c[s>>2]<<1<<2)>>2]=c[k>>2];We(c[u>>2]|0,c[m>>2]|0,c[n>>2]|0,c[s>>2]|0);Nf(c[u>>2]|0,(c[o>>2]|0)+(c[s>>2]<<1<<2)+4|0,c[o>>2]|0,c[s>>2]|0,(c[p>>2]|0)+(c[q>>2]|0)|0,c[h>>2]|0,c[j>>2]|0);if((((c[t>>2]|0)!=0|0)!=0|0)==0){i=v;return}Od(c[t>>2]|0);i=v;return}function pf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;e=i;i=i+16|0;d=e+8|0;f=e+4|0;g=e;c[f>>2]=a;c[g>>2]=b;while(1){a=(c[g>>2]|0)+ -1|0;c[g>>2]=a;if((a|0)<0){b=5;break}if((c[(c[f>>2]|0)+(c[g>>2]<<2)>>2]|0)!=0){b=4;break}}if((b|0)==4){c[d>>2]=0;a=c[d>>2]|0;i=e;return a|0}else if((b|0)==5){c[d>>2]=1;a=c[d>>2]|0;i=e;return a|0}return 0}function qf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;h=i;i=i+80|0;m=h+76|0;r=h+72|0;B=h+68|0;q=h+64|0;A=h+60|0;k=h+56|0;j=h+48|0;o=h+44|0;p=h+40|0;n=h+36|0;s=h+32|0;l=h+28|0;z=h+24|0;u=h+20|0;y=h+16|0;w=h+12|0;t=h+8|0;x=h+4|0;v=h;c[m>>2]=a;c[r>>2]=b;c[B>>2]=d;c[q>>2]=e;c[A>>2]=f;c[k>>2]=g;c[h+52>>2]=1;c[j>>2]=(((c[B>>2]|0)+2|0)>>>0)/3|0;c[o>>2]=(c[B>>2]|0)-(c[j>>2]<<1);c[p>>2]=(c[A>>2]|0)-(c[j>>2]<<1);c[u>>2]=(c[k>>2]|0)+(c[j>>2]<<2<<2)+16;c[y>>2]=(c[k>>2]|0)+(c[j>>2]<<1<<2)+8;c[w>>2]=(c[m>>2]|0)+(c[j>>2]<<2)+4;c[t>>2]=c[m>>2];c[x>>2]=(c[k>>2]|0)+((c[j>>2]|0)*3<<2)+12;c[v>>2]=(c[m>>2]|0)+(c[j>>2]<<1<<2)+8;c[z>>2]=c[k>>2];c[n>>2]=0;c[s>>2]=oe(c[z>>2]|0,c[r>>2]|0,c[j>>2]|0,(c[r>>2]|0)+(c[j>>2]<<1<<2)|0,c[o>>2]|0)|0;f=c[s>>2]|0;f=f+(qe(c[u>>2]|0,c[z>>2]|0,(c[r>>2]|0)+(c[j>>2]<<2)|0,c[j>>2]|0)|0)|0;c[(c[u>>2]|0)+(c[j>>2]<<2)>>2]=f;if((c[s>>2]|0)==0?(ff(c[z>>2]|0,(c[r>>2]|0)+(c[j>>2]<<2)|0,c[j>>2]|0)|0)<0:0){te(c[y>>2]|0,(c[r>>2]|0)+(c[j>>2]<<2)|0,c[z>>2]|0,c[j>>2]|0)|0;c[(c[y>>2]|0)+(c[j>>2]<<2)>>2]=0;c[n>>2]=1}else{B=te(c[y>>2]|0,c[z>>2]|0,(c[r>>2]|0)+(c[j>>2]<<2)|0,c[j>>2]|0)|0;c[s>>2]=(c[s>>2]|0)-B;c[(c[y>>2]|0)+(c[j>>2]<<2)>>2]=c[s>>2]}c[s>>2]=qe(c[w>>2]|0,(c[r>>2]|0)+(c[j>>2]<<1<<2)|0,c[u>>2]|0,c[o>>2]|0)|0;if((c[o>>2]|0)!=(c[j>>2]|0)){c[s>>2]=pe((c[w>>2]|0)+(c[o>>2]<<2)|0,(c[u>>2]|0)+(c[o>>2]<<2)|0,(c[j>>2]|0)-(c[o>>2]|0)|0,c[s>>2]|0)|0}c[s>>2]=(c[s>>2]|0)+(c[(c[u>>2]|0)+(c[j>>2]<<2)>>2]|0);B=c[s>>2]<<1;c[s>>2]=B+(xe(c[w>>2]|0,c[w>>2]|0,c[j>>2]|0,1)|0);B=te(c[w>>2]|0,c[w>>2]|0,c[r>>2]|0,c[j>>2]|0)|0;c[s>>2]=(c[s>>2]|0)-B;c[(c[w>>2]|0)+(c[j>>2]<<2)>>2]=c[s>>2];c[s>>2]=oe(c[z>>2]|0,c[q>>2]|0,c[j>>2]|0,(c[q>>2]|0)+(c[j>>2]<<1<<2)|0,c[p>>2]|0)|0;B=c[s>>2]|0;B=B+(qe(c[t>>2]|0,c[z>>2]|0,(c[q>>2]|0)+(c[j>>2]<<2)|0,c[j>>2]|0)|0)|0;c[(c[t>>2]|0)+(c[j>>2]<<2)>>2]=B;if((c[s>>2]|0)==0?(ff(c[z>>2]|0,(c[q>>2]|0)+(c[j>>2]<<2)|0,c[j>>2]|0)|0)<0:0){te(c[x>>2]|0,(c[q>>2]|0)+(c[j>>2]<<2)|0,c[z>>2]|0,c[j>>2]|0)|0;c[(c[x>>2]|0)+(c[j>>2]<<2)>>2]=0;c[n>>2]=c[n>>2]^1}else{B=te(c[x>>2]|0,c[z>>2]|0,(c[q>>2]|0)+(c[j>>2]<<2)|0,c[j>>2]|0)|0;c[s>>2]=(c[s>>2]|0)-B;c[(c[x>>2]|0)+(c[j>>2]<<2)>>2]=c[s>>2]}c[s>>2]=qe(c[v>>2]|0,c[t>>2]|0,(c[q>>2]|0)+(c[j>>2]<<1<<2)|0,c[p>>2]|0)|0;if((c[p>>2]|0)!=(c[j>>2]|0)){c[s>>2]=pe((c[v>>2]|0)+(c[p>>2]<<2)|0,(c[t>>2]|0)+(c[p>>2]<<2)|0,(c[j>>2]|0)-(c[p>>2]|0)|0,c[s>>2]|0)|0}c[s>>2]=(c[s>>2]|0)+(c[(c[t>>2]|0)+(c[j>>2]<<2)>>2]|0);z=c[s>>2]<<1;c[s>>2]=z+(xe(c[v>>2]|0,c[v>>2]|0,c[j>>2]|0,1)|0);z=te(c[v>>2]|0,c[v>>2]|0,c[q>>2]|0,c[j>>2]|0)|0;c[s>>2]=(c[s>>2]|0)-z;c[(c[v>>2]|0)+(c[j>>2]<<2)>>2]=c[s>>2];z=c[k>>2]|0;y=c[y>>2]|0;g=(c[j>>2]|0)+1|0;x=c[x>>2]|0;d=(c[j>>2]|0)+1|0;e=(c[k>>2]|0)+((c[j>>2]|0)*5<<2)+20|0;if(((c[j>>2]|0)+1|0)>=100){qf(z,y,g,x,d,e)}else{hf(z,y,g,x,d,e)}x=(c[k>>2]|0)+(c[j>>2]<<1<<2)+4|0;y=c[w>>2]|0;w=(c[j>>2]|0)+1|0;g=c[v>>2]|0;z=(c[j>>2]|0)+1|0;v=(c[k>>2]|0)+((c[j>>2]|0)*5<<2)+20|0;if(((c[j>>2]|0)+1|0)>=100){qf(x,y,w,g,z,v)}else{hf(x,y,w,g,z,v)}do{if((c[o>>2]|0)<=(c[p>>2]|0)){g=(c[m>>2]|0)+(c[j>>2]<<2<<2)|0;v=(c[r>>2]|0)+(c[j>>2]<<1<<2)|0;w=c[o>>2]|0;x=(c[q>>2]|0)+(c[j>>2]<<1<<2)|0;z=c[o>>2]|0;y=(c[k>>2]|0)+((c[j>>2]|0)*5<<2)+20|0;if((c[o>>2]|0)>=100){qf(g,v,w,x,z,y);break}else{hf(g,v,w,x,z,y);break}}else{De((c[m>>2]|0)+(c[j>>2]<<2<<2)|0,(c[r>>2]|0)+(c[j>>2]<<1<<2)|0,c[o>>2]|0,(c[q>>2]|0)+(c[j>>2]<<1<<2)|0,c[p>>2]|0)|0}}while(0);c[l>>2]=c[(c[m>>2]|0)+(c[j>>2]<<2<<2)>>2];c[s>>2]=c[(c[m>>2]|0)+(c[j>>2]<<2<<2)+4>>2];v=(c[m>>2]|0)+(c[j>>2]<<1<<2)|0;w=c[u>>2]|0;u=(c[j>>2]|0)+1|0;t=c[t>>2]|0;x=(c[j>>2]|0)+1|0;y=(c[k>>2]|0)+((c[j>>2]|0)*5<<2)+20|0;if(((c[j>>2]|0)+1|0)>=100){qf(v,w,u,t,x,y)}else{hf(v,w,u,t,x,y)}c[(c[m>>2]|0)+(c[j>>2]<<2<<2)+4>>2]=c[s>>2];s=c[m>>2]|0;t=c[r>>2]|0;r=c[j>>2]|0;v=c[q>>2]|0;u=c[j>>2]|0;q=(c[k>>2]|0)+((c[j>>2]|0)*5<<2)+20|0;if((c[j>>2]|0)>=100){qf(s,t,r,v,u,q);e=c[m>>2]|0;b=c[k>>2]|0;d=c[j>>2]|0;d=d<<1;d=b+(d<<2)|0;d=d+4|0;b=c[k>>2]|0;a=c[j>>2]|0;A=c[o>>2]|0;f=c[p>>2]|0;f=A+f|0;A=c[n>>2]|0;B=c[l>>2]|0;Nf(e,d,b,a,f,A,B);i=h;return}else{hf(s,t,r,v,u,q);e=c[m>>2]|0;b=c[k>>2]|0;d=c[j>>2]|0;d=d<<1;d=b+(d<<2)|0;d=d+4|0;b=c[k>>2]|0;a=c[j>>2]|0;A=c[o>>2]|0;f=c[p>>2]|0;f=A+f|0;A=c[n>>2]|0;B=c[l>>2]|0;Nf(e,d,b,a,f,A,B);i=h;return}}function rf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;p=i;i=i+48|0;m=p+40|0;q=p+36|0;s=p+32|0;k=p+28|0;t=p+24|0;o=p+20|0;n=p+16|0;j=p+12|0;l=p+8|0;h=p+4|0;r=p;c[m>>2]=a;c[q>>2]=b;c[s>>2]=d;c[k>>2]=e;c[t>>2]=f;c[o>>2]=g;if(((c[s>>2]|0)*3|0)>=(c[t>>2]<<2|0)){g=(c[s>>2]|0)-1>>2}else{g=(((c[t>>2]|0)-1|0)>>>0)/3|0}c[n>>2]=1+g;c[j>>2]=(c[s>>2]|0)-((c[n>>2]|0)*3|0);c[l>>2]=(c[t>>2]|0)-(c[n>>2]<<1);c[h>>2]=2&(Hf((c[m>>2]|0)+((c[n>>2]|0)*3<<2)+12|0,(c[o>>2]|0)+(c[n>>2]<<2<<2)+16|0,c[q>>2]|0,c[n>>2]|0,c[j>>2]|0,(c[o>>2]|0)+((c[n>>2]|0)*3<<2)+12|0)|0);a=xe((c[o>>2]|0)+(c[n>>2]<<1<<2)+8|0,(c[k>>2]|0)+(c[n>>2]<<2)|0,c[n>>2]|0,1)|0;c[(c[o>>2]|0)+(c[n>>2]<<1<<2)+8+(c[n>>2]<<2)>>2]=a;c[r>>2]=xe(c[o>>2]|0,(c[k>>2]|0)+(c[n>>2]<<1<<2)|0,c[l>>2]|0,2)|0;a=qe(c[o>>2]|0,c[o>>2]|0,c[k>>2]|0,c[l>>2]|0)|0;c[r>>2]=(c[r>>2]|0)+a;if((c[l>>2]|0)!=(c[n>>2]|0)){c[r>>2]=pe((c[o>>2]|0)+(c[l>>2]<<2)|0,(c[k>>2]|0)+(c[l>>2]<<2)|0,(c[n>>2]|0)-(c[l>>2]|0)|0,c[r>>2]|0)|0}c[(c[o>>2]|0)+(c[n>>2]<<2)>>2]=c[r>>2];qe((c[m>>2]|0)+(c[n>>2]<<1<<2)+8|0,c[o>>2]|0,(c[o>>2]|0)+(c[n>>2]<<1<<2)+8|0,(c[n>>2]|0)+1|0)|0;a=(ff(c[o>>2]|0,(c[o>>2]|0)+(c[n>>2]<<1<<2)+8|0,(c[n>>2]|0)+1|0)|0)<0;s=(c[m>>2]|0)+(c[n>>2]<<2)+4|0;r=c[o>>2]|0;if(a){te(s,r+(c[n>>2]<<1<<2)+8|0,c[o>>2]|0,(c[n>>2]|0)+1|0)|0;c[h>>2]=c[h>>2]^2}else{te(s,r,(c[o>>2]|0)+(c[n>>2]<<1<<2)+8|0,(c[n>>2]|0)+1|0)|0}a=c[h>>2]|0;c[h>>2]=a^1&(Gf((c[m>>2]|0)+(c[n>>2]<<2<<2)+16|0,(c[o>>2]|0)+((c[n>>2]|0)*3<<2)+12|0,c[q>>2]|0,c[n>>2]|0,c[j>>2]|0,c[o>>2]|0)|0);a=oe((c[o>>2]|0)+(c[n>>2]<<1<<2)+8|0,c[k>>2]|0,c[n>>2]|0,(c[k>>2]|0)+(c[n>>2]<<1<<2)|0,c[l>>2]|0)|0;c[(c[o>>2]|0)+(c[n>>2]<<1<<2)+8+(c[n>>2]<<2)>>2]=a;a=c[(c[o>>2]|0)+(c[n>>2]<<1<<2)+8+(c[n>>2]<<2)>>2]|0;a=a+(qe(c[m>>2]|0,(c[o>>2]|0)+(c[n>>2]<<1<<2)+8|0,(c[k>>2]|0)+(c[n>>2]<<2)|0,c[n>>2]|0)|0)|0;c[(c[m>>2]|0)+(c[n>>2]<<2)>>2]=a;if((c[(c[o>>2]|0)+(c[n>>2]<<1<<2)+8+(c[n>>2]<<2)>>2]|0)==0?(ff((c[o>>2]|0)+(c[n>>2]<<1<<2)+8|0,(c[k>>2]|0)+(c[n>>2]<<2)|0,c[n>>2]|0)|0)<0:0){te((c[o>>2]|0)+(c[n>>2]<<1<<2)+8|0,(c[k>>2]|0)+(c[n>>2]<<2)|0,(c[o>>2]|0)+(c[n>>2]<<1<<2)+8|0,c[n>>2]|0)|0;c[h>>2]=c[h>>2]^1}else{b=te((c[o>>2]|0)+(c[n>>2]<<1<<2)+8|0,(c[o>>2]|0)+(c[n>>2]<<1<<2)+8|0,(c[k>>2]|0)+(c[n>>2]<<2)|0,c[n>>2]|0)|0;a=(c[o>>2]|0)+(c[n>>2]<<1<<2)+8+(c[n>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)-b}We(c[o>>2]|0,(c[o>>2]|0)+((c[n>>2]|0)*3<<2)+12|0,(c[o>>2]|0)+(c[n>>2]<<1<<2)+8|0,(c[n>>2]|0)+1|0);We((c[o>>2]|0)+(c[n>>2]<<1<<2)+4|0,(c[o>>2]|0)+(c[n>>2]<<2<<2)+16|0,(c[m>>2]|0)+(c[n>>2]<<2)+4|0,(c[n>>2]|0)+1|0);We((c[o>>2]|0)+(c[n>>2]<<2<<2)+8|0,(c[m>>2]|0)+((c[n>>2]|0)*3<<2)+12|0,(c[m>>2]|0)+(c[n>>2]<<1<<2)+8|0,(c[n>>2]|0)+1|0);We((c[m>>2]|0)+(c[n>>2]<<1<<2)|0,(c[m>>2]|0)+(c[n>>2]<<2<<2)+16|0,c[m>>2]|0,(c[n>>2]|0)+1|0);r=(c[m>>2]|0)+((c[n>>2]|0)*5<<2)|0;if((c[j>>2]|0)>(c[l>>2]|0)){De(r,(c[q>>2]|0)+((c[n>>2]|0)*3<<2)|0,c[j>>2]|0,(c[k>>2]|0)+(c[n>>2]<<1<<2)|0,c[l>>2]|0)|0;e=c[m>>2]|0;f=c[q>>2]|0;g=c[k>>2]|0;t=c[n>>2]|0;We(e,f,g,t);t=c[m>>2]|0;g=c[n>>2]|0;f=c[h>>2]|0;e=c[o>>2]|0;s=c[o>>2]|0;d=c[n>>2]|0;d=d<<1;d=s+(d<<2)|0;d=d+4|0;s=c[o>>2]|0;b=c[n>>2]|0;b=b<<2;b=s+(b<<2)|0;b=b+8|0;s=c[l>>2]|0;a=c[j>>2]|0;a=s+a|0;Of(t,g,f,e,d,b,a);i=p;return}else{De(r,(c[k>>2]|0)+(c[n>>2]<<1<<2)|0,c[l>>2]|0,(c[q>>2]|0)+((c[n>>2]|0)*3<<2)|0,c[j>>2]|0)|0;e=c[m>>2]|0;f=c[q>>2]|0;g=c[k>>2]|0;t=c[n>>2]|0;We(e,f,g,t);t=c[m>>2]|0;g=c[n>>2]|0;f=c[h>>2]|0;e=c[o>>2]|0;s=c[o>>2]|0;d=c[n>>2]|0;d=d<<1;d=s+(d<<2)|0;d=d+4|0;s=c[o>>2]|0;b=c[n>>2]|0;b=b<<2;b=s+(b<<2)|0;b=b+8|0;s=c[l>>2]|0;a=c[j>>2]|0;a=s+a|0;Of(t,g,f,e,d,b,a);i=p;return}}function sf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;j=i;i=i+112|0;r=j+96|0;o=j+92|0;G=j+88|0;p=j+84|0;H=j+80|0;k=j+76|0;q=j+72|0;l=j+68|0;m=j+64|0;u=j+60|0;D=j+56|0;B=j+52|0;z=j+48|0;s=j+44|0;w=j+40|0;v=j+36|0;C=j+32|0;A=j+28|0;y=j+24|0;x=j+20|0;t=j+16|0;n=j+12|0;h=j+8|0;F=j+4|0;E=j;c[r>>2]=a;c[o>>2]=b;c[G>>2]=d;c[p>>2]=e;c[H>>2]=f;c[k>>2]=g;if(((c[G>>2]|0)*3|0)>=((c[H>>2]|0)*5|0)){g=(((c[G>>2]|0)-1|0)>>>0)/5|0}else{g=(((c[H>>2]|0)-1|0)>>>0)/3|0}c[q>>2]=1+g;c[l>>2]=(c[G>>2]|0)-(c[q>>2]<<2);c[m>>2]=(c[H>>2]|0)-(c[q>>2]<<1);c[h>>2]=0;a=i;i=i+((1*((c[q>>2]|0)+1<<2)|0)+15&-16)|0;c[B>>2]=a;a=i;i=i+((1*((c[q>>2]|0)+1<<2)|0)+15&-16)|0;c[z>>2]=a;a=i;i=i+((1*((c[q>>2]|0)+1<<2)|0)+15&-16)|0;c[s>>2]=a;a=i;i=i+((1*((c[q>>2]|0)+1<<2)|0)+15&-16)|0;c[w>>2]=a;a=i;i=i+((1*((c[q>>2]|0)+1<<2)|0)+15&-16)|0;c[v>>2]=a;a=i;i=i+((1*((c[q>>2]|0)+1<<2)|0)+15&-16)|0;c[C>>2]=a;a=i;i=i+((1*((c[q>>2]|0)+1<<2)|0)+15&-16)|0;c[A>>2]=a;a=i;i=i+((1*((c[q>>2]|0)+1<<2)|0)+15&-16)|0;c[y>>2]=a;a=i;i=i+((1*((c[q>>2]|0)+1<<2)|0)+15&-16)|0;c[x>>2]=a;a=i;i=i+((1*((c[q>>2]|0)+1<<2)|0)+15&-16)|0;c[t>>2]=a;c[D>>2]=c[r>>2];c[n>>2]=2&(If(c[B>>2]|0,c[z>>2]|0,4,c[o>>2]|0,c[q>>2]|0,c[l>>2]|0,c[D>>2]|0)|0);a=c[n>>2]|0;c[n>>2]=a|1&(Jf(c[s>>2]|0,c[w>>2]|0,4,c[o>>2]|0,c[q>>2]|0,c[l>>2]|0,c[D>>2]|0)|0);c[u>>2]=xe(c[v>>2]|0,c[o>>2]|0,c[q>>2]|0,1)|0;a=qe(c[v>>2]|0,c[v>>2]|0,(c[o>>2]|0)+(c[q>>2]<<2)|0,c[q>>2]|0)|0;c[u>>2]=(c[u>>2]|0)+a;a=c[u>>2]<<1;c[u>>2]=a+(xe(c[v>>2]|0,c[v>>2]|0,c[q>>2]|0,1)|0);a=qe(c[v>>2]|0,c[v>>2]|0,(c[o>>2]|0)+(c[q>>2]<<1<<2)|0,c[q>>2]|0)|0;c[u>>2]=(c[u>>2]|0)+a;a=c[u>>2]<<1;c[u>>2]=a+(xe(c[v>>2]|0,c[v>>2]|0,c[q>>2]|0,1)|0);a=qe(c[v>>2]|0,c[v>>2]|0,(c[o>>2]|0)+((c[q>>2]|0)*3<<2)|0,c[q>>2]|0)|0;c[u>>2]=(c[u>>2]|0)+a;a=c[u>>2]<<1;c[u>>2]=a+(xe(c[v>>2]|0,c[v>>2]|0,c[q>>2]|0,1)|0);a=c[u>>2]|0;a=a+(oe(c[v>>2]|0,c[v>>2]|0,c[q>>2]|0,(c[o>>2]|0)+(c[q>>2]<<2<<2)|0,c[l>>2]|0)|0)|0;c[(c[v>>2]|0)+(c[q>>2]<<2)>>2]=a;a=oe(c[C>>2]|0,c[p>>2]|0,c[q>>2]|0,(c[p>>2]|0)+(c[q>>2]<<1<<2)|0,c[m>>2]|0)|0;c[(c[C>>2]|0)+(c[q>>2]<<2)>>2]=a;if((c[(c[C>>2]|0)+(c[q>>2]<<2)>>2]|0)==0?(ff(c[C>>2]|0,(c[p>>2]|0)+(c[q>>2]<<2)|0,c[q>>2]|0)|0)<0:0){te(c[A>>2]|0,(c[p>>2]|0)+(c[q>>2]<<2)|0,c[C>>2]|0,c[q>>2]|0)|0;c[(c[A>>2]|0)+(c[q>>2]<<2)>>2]=0;c[n>>2]=c[n>>2]^2}else{a=c[(c[C>>2]|0)+(c[q>>2]<<2)>>2]|0;a=a-(te(c[A>>2]|0,c[C>>2]|0,(c[p>>2]|0)+(c[q>>2]<<2)|0,c[q>>2]|0)|0)|0;c[(c[A>>2]|0)+(c[q>>2]<<2)>>2]=a}b=qe(c[C>>2]|0,c[C>>2]|0,(c[p>>2]|0)+(c[q>>2]<<2)|0,c[q>>2]|0)|0;a=(c[C>>2]|0)+(c[q>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)+b;c[u>>2]=xe(c[D>>2]|0,(c[p>>2]|0)+(c[q>>2]<<1<<2)|0,c[m>>2]|0,2)|0;a=oe(c[y>>2]|0,c[p>>2]|0,c[q>>2]|0,c[D>>2]|0,c[m>>2]|0)|0;c[(c[y>>2]|0)+(c[q>>2]<<2)>>2]=a;c[E>>2]=(c[y>>2]|0)+(c[m>>2]<<2);c[F>>2]=(c[c[E>>2]>>2]|0)+(c[u>>2]|0);c[c[E>>2]>>2]=c[F>>2];if((c[F>>2]|0)>>>0<(c[u>>2]|0)>>>0){do{b=(c[E>>2]|0)+4|0;c[E>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}a=xe(c[D>>2]|0,(c[p>>2]|0)+(c[q>>2]<<2)|0,c[q>>2]|0,1)|0;c[(c[D>>2]|0)+(c[q>>2]<<2)>>2]=a;a=(ff(c[y>>2]|0,c[D>>2]|0,(c[q>>2]|0)+1|0)|0)<0;E=c[x>>2]|0;if(a){te(E,c[D>>2]|0,c[y>>2]|0,(c[q>>2]|0)+1|0)|0;c[n>>2]=c[n>>2]^1}else{te(E,c[y>>2]|0,c[D>>2]|0,(c[q>>2]|0)+1|0)|0}qe(c[y>>2]|0,c[y>>2]|0,c[D>>2]|0,(c[q>>2]|0)+1|0)|0;c[u>>2]=xe(c[t>>2]|0,c[p>>2]|0,c[q>>2]|0,1)|0;a=qe(c[t>>2]|0,c[t>>2]|0,(c[p>>2]|0)+(c[q>>2]<<2)|0,c[q>>2]|0)|0;c[u>>2]=(c[u>>2]|0)+a;a=c[u>>2]<<1;c[u>>2]=a+(xe(c[t>>2]|0,c[t>>2]|0,c[q>>2]|0,1)|0);a=c[u>>2]|0;a=a+(oe(c[t>>2]|0,c[t>>2]|0,c[q>>2]|0,(c[p>>2]|0)+(c[q>>2]<<1<<2)|0,c[m>>2]|0)|0)|0;c[(c[t>>2]|0)+(c[q>>2]<<2)>>2]=a;We(c[k>>2]|0,c[s>>2]|0,c[y>>2]|0,(c[q>>2]|0)+1|0);We((c[k>>2]|0)+(c[q>>2]<<1<<2)+4|0,c[w>>2]|0,c[x>>2]|0,(c[q>>2]|0)+1|0);We((c[k>>2]|0)+(c[q>>2]<<2<<2)+8|0,c[v>>2]|0,c[t>>2]|0,(c[q>>2]|0)+1|0);c[(c[k>>2]|0)+((c[q>>2]|0)*6<<2)+12+(c[q>>2]<<1<<2)>>2]=0;We((c[k>>2]|0)+((c[q>>2]|0)*6<<2)+12|0,c[z>>2]|0,c[A>>2]|0,(c[q>>2]|0)+((c[(c[z>>2]|0)+(c[q>>2]<<2)>>2]|c[(c[A>>2]|0)+(c[q>>2]<<2)>>2]|0)!=0)|0);c[(c[r>>2]|0)+(c[q>>2]<<1<<2)+(c[q>>2]<<1<<2)>>2]=0;We((c[r>>2]|0)+(c[q>>2]<<1<<2)|0,c[B>>2]|0,c[C>>2]|0,(c[q>>2]|0)+((c[(c[B>>2]|0)+(c[q>>2]<<2)>>2]|c[(c[C>>2]|0)+(c[q>>2]<<2)>>2]|0)!=0)|0);We(c[r>>2]|0,c[o>>2]|0,c[p>>2]|0,c[q>>2]|0);s=(c[r>>2]|0)+((c[q>>2]|0)*6<<2)|0;if((c[l>>2]|0)>(c[m>>2]|0)){De(s,(c[o>>2]|0)+(c[q>>2]<<2<<2)|0,c[l>>2]|0,(c[p>>2]|0)+(c[q>>2]<<1<<2)|0,c[m>>2]|0)|0}else{De(s,(c[p>>2]|0)+(c[q>>2]<<1<<2)|0,c[m>>2]|0,(c[o>>2]|0)+(c[q>>2]<<2<<2)|0,c[l>>2]|0)|0}Pf(c[r>>2]|0,c[q>>2]|0,c[n>>2]|0,(c[k>>2]|0)+(c[q>>2]<<1<<2)+4|0,(c[k>>2]|0)+((c[q>>2]|0)*6<<2)+12|0,c[k>>2]|0,(c[k>>2]|0)+(c[q>>2]<<2<<2)+8|0,(c[l>>2]|0)+(c[m>>2]|0)|0,(c[k>>2]|0)+(c[q>>2]<<3<<2)+16|0);if((((c[h>>2]|0)!=0|0)!=0|0)==0){i=j;return}Od(c[h>>2]|0);i=j;return}function tf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;o=i;i=i+48|0;m=o+40|0;p=o+36|0;s=o+32|0;k=o+28|0;t=o+24|0;h=o+20|0;n=o+16|0;j=o+12|0;l=o+8|0;r=o+4|0;q=o;c[m>>2]=a;c[p>>2]=b;c[s>>2]=d;c[k>>2]=e;c[t>>2]=f;c[h>>2]=g;if((c[s>>2]|0)>=(c[t>>2]<<1|0)){g=(((c[s>>2]|0)-1|0)>>>0)/6|0}else{g=(((c[t>>2]|0)-1|0)>>>0)/3|0}c[n>>2]=1+g;c[j>>2]=(c[s>>2]|0)-((c[n>>2]|0)*5|0);c[l>>2]=(c[t>>2]|0)-(c[n>>2]<<1);c[q>>2]=Kf((c[m>>2]|0)+((c[n>>2]|0)*5<<2)+8|0,(c[m>>2]|0)+((c[n>>2]|0)*3<<2)|0,5,c[p>>2]|0,c[n>>2]|0,c[j>>2]|0,2,c[m>>2]|0)|0;s=xe(c[m>>2]|0,(c[k>>2]|0)+(c[n>>2]<<2)|0,c[n>>2]|0,2)|0;c[(c[m>>2]|0)+(c[n>>2]<<2)>>2]=s;s=xe((c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12|0,(c[k>>2]|0)+(c[n>>2]<<1<<2)|0,c[l>>2]|0,4)|0;c[(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12+(c[l>>2]<<2)>>2]=s;s=(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12|0;if((c[n>>2]|0)==(c[l>>2]|0)){b=qe(s,(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12|0,(c[k>>2]|0)+(0<<2)|0,c[n>>2]|0)|0;a=(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12+(c[n>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)+b}else{a=oe(s,(c[k>>2]|0)+(0<<2)|0,c[n>>2]|0,(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12|0,(c[l>>2]|0)+1|0)|0;c[(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12+(c[n>>2]<<2)>>2]=a}a=uf((c[m>>2]|0)+(c[n>>2]<<2<<2)+4|0,(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12|0,c[m>>2]|0,(c[n>>2]|0)+1|0)|0;c[q>>2]=c[q>>2]^a;We(c[m>>2]|0,(c[m>>2]|0)+((c[n>>2]|0)*3<<2)|0,(c[m>>2]|0)+(c[n>>2]<<2<<2)+4|0,(c[n>>2]|0)+1|0);We((c[h>>2]|0)+((c[n>>2]|0)*3<<2)+4|0,(c[m>>2]|0)+((c[n>>2]|0)*5<<2)+8|0,(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12|0,(c[n>>2]|0)+1|0);Bf((c[h>>2]|0)+((c[n>>2]|0)*3<<2)+4|0,(c[n>>2]<<1)+1|0,c[m>>2]|0,c[q>>2]|0,c[n>>2]|0,2,4);c[q>>2]=If((c[m>>2]|0)+((c[n>>2]|0)*5<<2)+8|0,(c[m>>2]|0)+((c[n>>2]|0)*3<<2)|0,5,c[p>>2]|0,c[n>>2]|0,c[j>>2]|0,c[m>>2]|0)|0;c[r>>2]=oe((c[h>>2]|0)+((c[n>>2]|0)*6<<2)+8|0,(c[k>>2]|0)+(0<<2)|0,c[n>>2]|0,(c[k>>2]|0)+(c[n>>2]<<1<<2)|0,c[l>>2]|0)|0;a=c[r>>2]|0;a=a+(qe((c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12|0,(c[h>>2]|0)+((c[n>>2]|0)*6<<2)+8|0,(c[k>>2]|0)+(c[n>>2]<<2)|0,c[n>>2]|0)|0)|0;c[(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12+(c[n>>2]<<2)>>2]=a;if((c[r>>2]|0)==0?(ff((c[h>>2]|0)+((c[n>>2]|0)*6<<2)+8|0,(c[k>>2]|0)+(c[n>>2]<<2)|0,c[n>>2]|0)|0)<0:0){te((c[m>>2]|0)+(c[n>>2]<<2<<2)+4|0,(c[k>>2]|0)+(c[n>>2]<<2)|0,(c[h>>2]|0)+((c[n>>2]|0)*6<<2)+8|0,c[n>>2]|0)|0;c[(c[m>>2]|0)+(c[n>>2]<<2<<2)+4+(c[n>>2]<<2)>>2]=0;c[q>>2]=~c[q>>2]}else{a=te((c[m>>2]|0)+(c[n>>2]<<2<<2)+4|0,(c[h>>2]|0)+((c[n>>2]|0)*6<<2)+8|0,(c[k>>2]|0)+(c[n>>2]<<2)|0,c[n>>2]|0)|0;c[r>>2]=(c[r>>2]|0)-a;c[(c[m>>2]|0)+(c[n>>2]<<2<<2)+4+(c[n>>2]<<2)>>2]=c[r>>2]}We(c[m>>2]|0,(c[m>>2]|0)+((c[n>>2]|0)*3<<2)|0,(c[m>>2]|0)+(c[n>>2]<<2<<2)+4|0,(c[n>>2]|0)+1|0);We(c[h>>2]|0,(c[m>>2]|0)+((c[n>>2]|0)*5<<2)+8|0,(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12|0,(c[n>>2]|0)+1|0);Bf(c[h>>2]|0,(c[n>>2]<<1)+1|0,c[m>>2]|0,c[q>>2]|0,c[n>>2]|0,0,0);c[q>>2]=Jf((c[m>>2]|0)+((c[n>>2]|0)*5<<2)+8|0,(c[m>>2]|0)+((c[n>>2]|0)*3<<2)|0,5,c[p>>2]|0,c[n>>2]|0,c[j>>2]|0,c[m>>2]|0)|0;r=xe(c[m>>2]|0,(c[k>>2]|0)+(c[n>>2]<<2)|0,c[n>>2]|0,1)|0;c[(c[m>>2]|0)+(c[n>>2]<<2)>>2]=r;r=xe((c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12|0,(c[k>>2]|0)+(c[n>>2]<<1<<2)|0,c[l>>2]|0,2)|0;c[(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12+(c[l>>2]<<2)>>2]=r;r=(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12|0;if((c[n>>2]|0)==(c[l>>2]|0)){b=qe(r,(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12|0,(c[k>>2]|0)+(0<<2)|0,c[n>>2]|0)|0;a=(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12+(c[n>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)+b}else{a=oe(r,(c[k>>2]|0)+(0<<2)|0,c[n>>2]|0,(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12|0,(c[l>>2]|0)+1|0)|0;c[(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12+(c[n>>2]<<2)>>2]=a}a=uf((c[m>>2]|0)+(c[n>>2]<<2<<2)+4|0,(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12|0,c[m>>2]|0,(c[n>>2]|0)+1|0)|0;c[q>>2]=c[q>>2]^a;We(c[m>>2]|0,(c[m>>2]|0)+((c[n>>2]|0)*3<<2)|0,(c[m>>2]|0)+(c[n>>2]<<2<<2)+4|0,(c[n>>2]|0)+1|0);We((c[m>>2]|0)+((c[n>>2]|0)*3<<2)|0,(c[m>>2]|0)+((c[n>>2]|0)*5<<2)+8|0,(c[m>>2]|0)+((c[n>>2]|0)*6<<2)+12|0,(c[n>>2]|0)+1|0);Bf((c[m>>2]|0)+((c[n>>2]|0)*3<<2)|0,(c[n>>2]<<1)+1|0,c[m>>2]|0,c[q>>2]|0,c[n>>2]|0,1,2);We(c[m>>2]|0,c[p>>2]|0,c[k>>2]|0,c[n>>2]|0);q=(c[m>>2]|0)+((c[n>>2]|0)*7<<2)|0;if((c[j>>2]|0)>(c[l>>2]|0)){De(q,(c[p>>2]|0)+((c[n>>2]|0)*5<<2)|0,c[j>>2]|0,(c[k>>2]|0)+(c[n>>2]<<1<<2)|0,c[l>>2]|0)|0;g=c[m>>2]|0;f=c[n>>2]|0;d=c[h>>2]|0;e=c[n>>2]|0;e=e*3|0;e=d+(e<<2)|0;e=e+4|0;d=c[h>>2]|0;t=c[j>>2]|0;b=c[l>>2]|0;b=t+b|0;t=c[h>>2]|0;a=c[n>>2]|0;a=a*6|0;a=t+(a<<2)|0;a=a+8|0;Qf(g,f,e,d,b,a);i=o;return}else{De(q,(c[k>>2]|0)+(c[n>>2]<<1<<2)|0,c[l>>2]|0,(c[p>>2]|0)+((c[n>>2]|0)*5<<2)|0,c[j>>2]|0)|0;g=c[m>>2]|0;f=c[n>>2]|0;d=c[h>>2]|0;e=c[n>>2]|0;e=e*3|0;e=d+(e<<2)|0;e=e+4|0;d=c[h>>2]|0;t=c[j>>2]|0;b=c[l>>2]|0;b=t+b|0;t=c[h>>2]|0;a=c[n>>2]|0;a=a*6|0;a=t+(a<<2)|0;a=a+8|0;Qf(g,f,e,d,b,a);i=o;return}}function uf(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;g=i;i=i+32|0;l=g+16|0;k=g+12|0;j=g+8|0;h=g+4|0;f=g;c[l>>2]=a;c[k>>2]=b;c[j>>2]=d;c[h>>2]=e;c[f>>2]=vf(c[l>>2]|0,c[k>>2]|0,c[j>>2]|0,c[h>>2]|0)|0;qe(c[k>>2]|0,c[k>>2]|0,c[j>>2]|0,c[h>>2]|0)|0;i=g;return c[f>>2]|0}function vf(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+32|0;l=g+24|0;o=g+20|0;h=g+16|0;j=g+12|0;k=g+8|0;f=g+4|0;m=g;c[o>>2]=a;c[h>>2]=b;c[j>>2]=d;c[k>>2]=e;while(1){a=(c[k>>2]|0)+ -1|0;c[k>>2]=a;if((a|0)<0){n=8;break}c[f>>2]=c[(c[h>>2]|0)+(c[k>>2]<<2)>>2];c[m>>2]=c[(c[j>>2]|0)+(c[k>>2]<<2)>>2];e=c[k>>2]|0;if((c[f>>2]|0)!=(c[m>>2]|0)){break}c[(c[o>>2]|0)+(e<<2)>>2]=0}if((n|0)==8){c[l>>2]=0;a=c[l>>2]|0;i=g;return a|0}c[k>>2]=e+1;n=c[o>>2]|0;if((c[f>>2]|0)>>>0>(c[m>>2]|0)>>>0){te(n,c[h>>2]|0,c[j>>2]|0,c[k>>2]|0)|0;c[l>>2]=0;a=c[l>>2]|0;i=g;return a|0}else{te(n,c[j>>2]|0,c[h>>2]|0,c[k>>2]|0)|0;c[l>>2]=-1;a=c[l>>2]|0;i=g;return a|0}return 0}function wf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;n=i;i=i+48|0;h=n+40|0;q=n+36|0;t=n+32|0;p=n+28|0;s=n+24|0;m=n+20|0;o=n+16|0;j=n+12|0;k=n+8|0;r=n+4|0;l=n;c[h>>2]=a;c[q>>2]=b;c[t>>2]=d;c[p>>2]=e;c[s>>2]=f;c[m>>2]=g;c[o>>2]=(c[t>>2]|0)+3>>2;c[j>>2]=(c[t>>2]|0)-((c[o>>2]|0)*3|0);c[k>>2]=(c[s>>2]|0)-((c[o>>2]|0)*3|0);c[l>>2]=1&(Hf(c[h>>2]|0,(c[h>>2]|0)+(c[o>>2]<<2)+4|0,c[q>>2]|0,c[o>>2]|0,c[j>>2]|0,(c[m>>2]|0)+(c[o>>2]<<3<<2)+20|0)|0);a=c[l>>2]|0;c[l>>2]=a^1&(Hf((c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0,(c[h>>2]|0)+(c[o>>2]<<1<<2)+8|0,c[p>>2]|0,c[o>>2]|0,c[k>>2]|0,(c[m>>2]|0)+(c[o>>2]<<3<<2)+20|0)|0);a=c[m>>2]|0;g=c[h>>2]|0;b=(c[o>>2]|0)+1|0;d=(c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0;e=(c[o>>2]|0)+1|0;f=(c[m>>2]|0)+(c[o>>2]<<3<<2)+20|0;if(((c[o>>2]|0)+1|0)>=100){qf(a,g,b,d,e,f)}else{hf(a,g,b,d,e,f)}a=(c[m>>2]|0)+(c[o>>2]<<1<<2)+4|0;g=(c[h>>2]|0)+(c[o>>2]<<2)+4|0;b=(c[o>>2]|0)+1|0;d=(c[h>>2]|0)+(c[o>>2]<<1<<2)+8|0;e=(c[o>>2]|0)+1|0;f=(c[m>>2]|0)+(c[o>>2]<<3<<2)+20|0;if(((c[o>>2]|0)+1|0)>=100){qf(a,g,b,d,e,f)}else{hf(a,g,b,d,e,f)}c[r>>2]=xe(c[h>>2]|0,c[q>>2]|0,c[o>>2]|0,1)|0;b=qe(c[h>>2]|0,c[h>>2]|0,(c[q>>2]|0)+(c[o>>2]<<2)|0,c[o>>2]|0)|0;c[r>>2]=(c[r>>2]|0)+b;b=c[r>>2]<<1;c[r>>2]=b+(xe(c[h>>2]|0,c[h>>2]|0,c[o>>2]|0,1)|0);b=qe(c[h>>2]|0,c[h>>2]|0,(c[q>>2]|0)+(c[o>>2]<<1<<2)|0,c[o>>2]|0)|0;c[r>>2]=(c[r>>2]|0)+b;b=c[r>>2]<<1;c[r>>2]=b+(xe(c[h>>2]|0,c[h>>2]|0,c[o>>2]|0,1)|0);b=c[r>>2]|0;b=b+(oe(c[h>>2]|0,c[h>>2]|0,c[o>>2]|0,(c[q>>2]|0)+((c[o>>2]|0)*3<<2)|0,c[j>>2]|0)|0)|0;c[(c[h>>2]|0)+(c[o>>2]<<2)>>2]=b;c[r>>2]=xe((c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0,c[p>>2]|0,c[o>>2]|0,1)|0;b=qe((c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0,(c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0,(c[p>>2]|0)+(c[o>>2]<<2)|0,c[o>>2]|0)|0;c[r>>2]=(c[r>>2]|0)+b;b=c[r>>2]<<1;c[r>>2]=b+(xe((c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0,(c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0,c[o>>2]|0,1)|0);b=qe((c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0,(c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0,(c[p>>2]|0)+(c[o>>2]<<1<<2)|0,c[o>>2]|0)|0;c[r>>2]=(c[r>>2]|0)+b;b=c[r>>2]<<1;c[r>>2]=b+(xe((c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0,(c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0,c[o>>2]|0,1)|0);b=c[r>>2]|0;b=b+(oe((c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0,(c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0,c[o>>2]|0,(c[p>>2]|0)+((c[o>>2]|0)*3<<2)|0,c[k>>2]|0)|0)|0;c[(c[h>>2]|0)+(c[o>>2]<<2<<2)+8+(c[o>>2]<<2)>>2]=b;b=(c[m>>2]|0)+(c[o>>2]<<2<<2)+8|0;d=c[h>>2]|0;e=(c[o>>2]|0)+1|0;f=(c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0;g=(c[o>>2]|0)+1|0;r=(c[m>>2]|0)+(c[o>>2]<<3<<2)+20|0;if(((c[o>>2]|0)+1|0)>=100){qf(b,d,e,f,g,r)}else{hf(b,d,e,f,g,r)}g=c[l>>2]|0;c[l>>2]=g|2&(Gf(c[h>>2]|0,(c[h>>2]|0)+(c[o>>2]<<2)+4|0,c[q>>2]|0,c[o>>2]|0,c[j>>2]|0,(c[m>>2]|0)+(c[o>>2]<<3<<2)+20|0)|0);g=c[l>>2]|0;c[l>>2]=g^2&(Gf((c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0,(c[h>>2]|0)+(c[o>>2]<<1<<2)+8|0,c[p>>2]|0,c[o>>2]|0,c[k>>2]|0,(c[m>>2]|0)+(c[o>>2]<<3<<2)+20|0)|0);g=(c[m>>2]|0)+((c[o>>2]|0)*6<<2)+12|0;b=(c[h>>2]|0)+(c[o>>2]<<2)+4|0;d=(c[o>>2]|0)+1|0;e=(c[h>>2]|0)+(c[o>>2]<<1<<2)+8|0;f=(c[o>>2]|0)+1|0;r=(c[m>>2]|0)+(c[o>>2]<<3<<2)+20|0;if(((c[o>>2]|0)+1|0)>=100){qf(g,b,d,e,f,r)}else{hf(g,b,d,e,f,r)}g=(c[h>>2]|0)+(c[o>>2]<<1<<2)|0;b=c[h>>2]|0;d=(c[o>>2]|0)+1|0;e=(c[h>>2]|0)+(c[o>>2]<<2<<2)+8|0;f=(c[o>>2]|0)+1|0;r=(c[m>>2]|0)+(c[o>>2]<<3<<2)+20|0;if(((c[o>>2]|0)+1|0)>=100){qf(g,b,d,e,f,r)}else{hf(g,b,d,e,f,r)}g=c[h>>2]|0;b=c[q>>2]|0;d=c[o>>2]|0;e=c[p>>2]|0;f=c[o>>2]|0;r=(c[m>>2]|0)+(c[o>>2]<<3<<2)+20|0;if((c[o>>2]|0)>=100){qf(g,b,d,e,f,r)}else{hf(g,b,d,e,f,r)}if((c[j>>2]|0)>(c[k>>2]|0)){De((c[h>>2]|0)+((c[o>>2]|0)*6<<2)|0,(c[q>>2]|0)+((c[o>>2]|0)*3<<2)|0,c[j>>2]|0,(c[p>>2]|0)+((c[o>>2]|0)*3<<2)|0,c[k>>2]|0)|0;r=c[h>>2]|0;f=c[o>>2]|0;e=c[l>>2]|0;g=c[m>>2]|0;d=c[o>>2]|0;d=d<<1;d=g+(d<<2)|0;d=d+4|0;g=c[m>>2]|0;b=c[o>>2]|0;b=b*6|0;b=g+(b<<2)|0;b=b+12|0;g=c[m>>2]|0;q=c[m>>2]|0;a=c[o>>2]|0;a=a<<2;a=q+(a<<2)|0;a=a+8|0;q=c[j>>2]|0;s=c[k>>2]|0;s=q+s|0;q=c[m>>2]|0;t=c[o>>2]|0;t=t<<3;t=q+(t<<2)|0;t=t+20|0;Pf(r,f,e,d,b,g,a,s,t);i=n;return}r=(c[h>>2]|0)+((c[o>>2]|0)*6<<2)|0;f=(c[q>>2]|0)+((c[o>>2]|0)*3<<2)|0;q=c[j>>2]|0;d=(c[p>>2]|0)+((c[o>>2]|0)*3<<2)|0;e=c[j>>2]|0;p=(c[m>>2]|0)+(c[o>>2]<<3<<2)+20|0;if((c[j>>2]|0)>=100){qf(r,f,q,d,e,p);r=c[h>>2]|0;f=c[o>>2]|0;e=c[l>>2]|0;g=c[m>>2]|0;d=c[o>>2]|0;d=d<<1;d=g+(d<<2)|0;d=d+4|0;g=c[m>>2]|0;b=c[o>>2]|0;b=b*6|0;b=g+(b<<2)|0;b=b+12|0;g=c[m>>2]|0;q=c[m>>2]|0;a=c[o>>2]|0;a=a<<2;a=q+(a<<2)|0;a=a+8|0;q=c[j>>2]|0;s=c[k>>2]|0;s=q+s|0;q=c[m>>2]|0;t=c[o>>2]|0;t=t<<3;t=q+(t<<2)|0;t=t+20|0;Pf(r,f,e,d,b,g,a,s,t);i=n;return}else{hf(r,f,q,d,e,p);r=c[h>>2]|0;f=c[o>>2]|0;e=c[l>>2]|0;g=c[m>>2]|0;d=c[o>>2]|0;d=d<<1;d=g+(d<<2)|0;d=d+4|0;g=c[m>>2]|0;b=c[o>>2]|0;b=b*6|0;b=g+(b<<2)|0;b=b+12|0;g=c[m>>2]|0;q=c[m>>2]|0;a=c[o>>2]|0;a=a<<2;a=q+(a<<2)|0;a=a+8|0;q=c[j>>2]|0;s=c[k>>2]|0;s=q+s|0;q=c[m>>2]|0;t=c[o>>2]|0;t=t<<3;t=q+(t<<2)|0;t=t+20|0;Pf(r,f,e,d,b,g,a,s,t);i=n;return}}function xf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;l=i;i=i+64|0;k=l+48|0;o=l+44|0;u=l+40|0;r=l+36|0;v=l+32|0;s=l+28|0;j=l+24|0;p=l+20|0;h=l+16|0;n=l+12|0;q=l+8|0;m=l+4|0;t=l;c[k>>2]=a;c[o>>2]=b;c[u>>2]=d;c[r>>2]=e;c[v>>2]=f;c[s>>2]=g;f=c[u>>2]|0;do{if(((((c[u>>2]|0)*17|0)<((c[v>>2]|0)*18|0)|0)!=0|0)==0){do{if(((f*5|0)*18|0)>=((c[v>>2]|0)*119|0)){if((((c[u>>2]|0)*5|0)*17|0)<((c[v>>2]|0)*126|0)){c[n>>2]=7;c[q>>2]=5;break}if(((c[u>>2]|0)*18|0)<((c[v>>2]|0)*34|0)){c[n>>2]=8;c[q>>2]=5;break}if(((c[u>>2]|0)*17|0)<((c[v>>2]|0)*36|0)){c[n>>2]=8;c[q>>2]=4;break}else{c[n>>2]=9;c[q>>2]=4;break}}else{c[n>>2]=7;c[q>>2]=6}}while(0);c[m>>2]=(c[n>>2]^c[q>>2])&1;g=ea(c[q>>2]|0,c[u>>2]|0)|0;if((g|0)>=(ea(c[n>>2]|0,c[v>>2]|0)|0)){f=(((c[u>>2]|0)-1|0)>>>0)/((c[n>>2]|0)>>>0)|0}else{f=(((c[v>>2]|0)-1|0)>>>0)/((c[q>>2]|0)>>>0)|0}c[j>>2]=1+f;c[n>>2]=(c[n>>2]|0)+ -1;c[q>>2]=(c[q>>2]|0)+ -1;c[p>>2]=(c[u>>2]|0)-(ea(c[n>>2]|0,c[j>>2]|0)|0);c[h>>2]=(c[v>>2]|0)-(ea(c[q>>2]|0,c[j>>2]|0)|0);if((c[m>>2]|0)!=0){if((((c[p>>2]|0)<1|0)!=0|0)!=0){c[n>>2]=(c[n>>2]|0)+ -1;c[p>>2]=(c[p>>2]|0)+(c[j>>2]|0);c[m>>2]=0;break}if((((c[h>>2]|0)<1|0)!=0|0)!=0){c[q>>2]=(c[q>>2]|0)+ -1;c[h>>2]=(c[h>>2]|0)+(c[j>>2]|0);c[m>>2]=0}}}else{c[j>>2]=1+(((f-1|0)>>>0)/6|0);c[q>>2]=5;c[n>>2]=5;c[m>>2]=0;c[p>>2]=(c[u>>2]|0)-((c[j>>2]|0)*5|0);c[h>>2]=(c[v>>2]|0)-((c[j>>2]|0)*5|0)}}while(0);g=Lf((c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,c[n>>2]|0,c[o>>2]|0,c[j>>2]|0,c[p>>2]|0,1,c[k>>2]|0)|0;c[t>>2]=g^(Lf((c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0,c[q>>2]|0,c[r>>2]|0,c[j>>2]|0,c[h>>2]|0,1,c[k>>2]|0)|0);do{if(((c[j>>2]|0)+1|0)>=100){if(((c[j>>2]|0)+1|0)<300){qf(c[k>>2]|0,(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,(c[j>>2]|0)+1|0,(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);qf(c[s>>2]|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);break}b=c[k>>2]|0;d=(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0;e=(c[j>>2]|0)+1|0;f=(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0;v=(c[j>>2]|0)+1|0;u=(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0;if(((c[j>>2]|0)+1|0)>=350){xf(b,d,e,f,v,u);xf(c[s>>2]|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);break}else{wf(b,d,e,f,v,u);wf(c[s>>2]|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);break}}else{hf(c[k>>2]|0,(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,(c[j>>2]|0)+1|0,(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);hf(c[s>>2]|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0)}}while(0);Bf(c[s>>2]|0,(c[j>>2]<<1)+1|0,c[k>>2]|0,c[t>>2]|0,c[j>>2]|0,1+(c[m>>2]|0)|0,c[m>>2]|0);c[t>>2]=If((c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,c[n>>2]|0,c[o>>2]|0,c[j>>2]|0,c[p>>2]|0,c[k>>2]|0)|0;u=(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0;v=(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0;if((((c[q>>2]|0)==3|0)!=0|0)!=0){g=Gf(u,v,c[r>>2]|0,c[j>>2]|0,c[h>>2]|0,c[k>>2]|0)|0;c[t>>2]=c[t>>2]^g}else{g=If(u,v,c[q>>2]|0,c[r>>2]|0,c[j>>2]|0,c[h>>2]|0,c[k>>2]|0)|0;c[t>>2]=c[t>>2]^g}do{if(((c[j>>2]|0)+1|0)>=100){if(((c[j>>2]|0)+1|0)<300){qf(c[k>>2]|0,(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,(c[j>>2]|0)+1|0,(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);qf((c[s>>2]|0)+((c[j>>2]|0)*3<<2)+4|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);break}b=c[k>>2]|0;d=(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0;e=(c[j>>2]|0)+1|0;f=(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0;v=(c[j>>2]|0)+1|0;u=(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0;if(((c[j>>2]|0)+1|0)>=350){xf(b,d,e,f,v,u);xf((c[s>>2]|0)+((c[j>>2]|0)*3<<2)+4|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);break}else{wf(b,d,e,f,v,u);wf((c[s>>2]|0)+((c[j>>2]|0)*3<<2)+4|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);break}}else{hf(c[k>>2]|0,(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,(c[j>>2]|0)+1|0,(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);hf((c[s>>2]|0)+((c[j>>2]|0)*3<<2)+4|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0)}}while(0);Bf((c[s>>2]|0)+((c[j>>2]|0)*3<<2)+4|0,(c[j>>2]<<1)+1|0,c[k>>2]|0,c[t>>2]|0,c[j>>2]|0,0,0);g=Kf((c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,c[n>>2]|0,c[o>>2]|0,c[j>>2]|0,c[p>>2]|0,2,c[k>>2]|0)|0;c[t>>2]=g^(Kf((c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0,c[q>>2]|0,c[r>>2]|0,c[j>>2]|0,c[h>>2]|0,2,c[k>>2]|0)|0);do{if(((c[j>>2]|0)+1|0)>=100){if(((c[j>>2]|0)+1|0)<300){qf(c[k>>2]|0,(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,(c[j>>2]|0)+1|0,(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);qf((c[s>>2]|0)+((c[j>>2]|0)*6<<2)+8|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);break}b=c[k>>2]|0;d=(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0;e=(c[j>>2]|0)+1|0;f=(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0;v=(c[j>>2]|0)+1|0;u=(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0;if(((c[j>>2]|0)+1|0)>=350){xf(b,d,e,f,v,u);xf((c[s>>2]|0)+((c[j>>2]|0)*6<<2)+8|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);break}else{wf(b,d,e,f,v,u);wf((c[s>>2]|0)+((c[j>>2]|0)*6<<2)+8|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);break}}else{hf(c[k>>2]|0,(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,(c[j>>2]|0)+1|0,(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);hf((c[s>>2]|0)+((c[j>>2]|0)*6<<2)+8|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0)}}while(0);Bf((c[s>>2]|0)+((c[j>>2]|0)*6<<2)+8|0,(c[j>>2]<<1)+1|0,c[k>>2]|0,c[t>>2]|0,c[j>>2]|0,2,4);g=Lf((c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,c[n>>2]|0,c[o>>2]|0,c[j>>2]|0,c[p>>2]|0,2,c[k>>2]|0)|0;c[t>>2]=g^(Lf((c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0,c[q>>2]|0,c[r>>2]|0,c[j>>2]|0,c[h>>2]|0,2,c[k>>2]|0)|0);do{if(((c[j>>2]|0)+1|0)>=100){if(((c[j>>2]|0)+1|0)<300){qf(c[k>>2]|0,(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,(c[j>>2]|0)+1|0,(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);qf((c[k>>2]|0)+((c[j>>2]|0)*3<<2)|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);break}b=c[k>>2]|0;d=(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0;e=(c[j>>2]|0)+1|0;f=(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0;v=(c[j>>2]|0)+1|0;u=(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0;if(((c[j>>2]|0)+1|0)>=350){xf(b,d,e,f,v,u);xf((c[k>>2]|0)+((c[j>>2]|0)*3<<2)|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);break}else{wf(b,d,e,f,v,u);wf((c[k>>2]|0)+((c[j>>2]|0)*3<<2)|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);break}}else{hf(c[k>>2]|0,(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,(c[j>>2]|0)+1|0,(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);hf((c[k>>2]|0)+((c[j>>2]|0)*3<<2)|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0)}}while(0);Bf((c[k>>2]|0)+((c[j>>2]|0)*3<<2)|0,(c[j>>2]<<1)+1|0,c[k>>2]|0,c[t>>2]|0,c[j>>2]|0,1+(c[m>>2]|0)<<1,c[m>>2]<<1);g=Jf((c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,c[n>>2]|0,c[o>>2]|0,c[j>>2]|0,c[p>>2]|0,c[k>>2]|0)|0;c[t>>2]=g^(Jf((c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0,c[q>>2]|0,c[r>>2]|0,c[j>>2]|0,c[h>>2]|0,c[k>>2]|0)|0);do{if(((c[j>>2]|0)+1|0)>=100){if(((c[j>>2]|0)+1|0)<300){qf(c[k>>2]|0,(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,(c[j>>2]|0)+1|0,(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);qf((c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);break}u=c[k>>2]|0;v=(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0;f=(c[j>>2]|0)+1|0;e=(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0;b=(c[j>>2]|0)+1|0;d=(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0;if(((c[j>>2]|0)+1|0)>=350){xf(u,v,f,e,b,d);xf((c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);break}else{wf(u,v,f,e,b,d);wf((c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);break}}else{hf(c[k>>2]|0,(c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,(c[j>>2]|0)+1|0,(c[k>>2]|0)+(c[j>>2]<<3<<2)+4|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0);hf((c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,(c[k>>2]|0)+((c[j>>2]|0)*9<<2)+8|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0,(c[j>>2]|0)+1|0,(c[s>>2]|0)+((c[j>>2]|0)*10<<2)+16|0)}}while(0);Bf((c[k>>2]|0)+((c[j>>2]|0)*7<<2)|0,(c[j>>2]<<1)+1|0,c[k>>2]|0,c[t>>2]|0,c[j>>2]|0,1,2);do{if((c[j>>2]|0)>=100){if((c[j>>2]|0)<300){qf(c[k>>2]|0,c[o>>2]|0,c[j>>2]|0,c[r>>2]|0,c[j>>2]|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0);break}d=c[k>>2]|0;e=c[o>>2]|0;f=c[j>>2]|0;v=c[r>>2]|0;t=c[j>>2]|0;u=(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0;if((c[j>>2]|0)>=350){xf(d,e,f,v,t,u);break}else{wf(d,e,f,v,t,u);break}}else{hf(c[k>>2]|0,c[o>>2]|0,c[j>>2]|0,c[r>>2]|0,c[j>>2]|0,(c[s>>2]|0)+((c[j>>2]|0)*9<<2)+12|0)}}while(0);if((((c[m>>2]|0)!=0|0)!=0|0)==0){u=c[k>>2]|0;e=c[s>>2]|0;v=c[j>>2]|0;v=v*6|0;v=e+(v<<2)|0;v=v+8|0;e=c[s>>2]|0;f=c[j>>2]|0;f=f*3|0;f=e+(f<<2)|0;f=f+4|0;e=c[s>>2]|0;d=c[j>>2]|0;a=c[p>>2]|0;b=c[h>>2]|0;b=a+b|0;a=c[m>>2]|0;t=c[s>>2]|0;g=c[j>>2]|0;g=g*9|0;g=t+(g<<2)|0;g=g+12|0;Sf(u,v,f,e,d,b,a,g);i=l;return}t=(c[k>>2]|0)+((c[j>>2]|0)*11<<2)|0;if((c[p>>2]|0)>(c[h>>2]|0)){e=(c[o>>2]|0)+((ea(c[n>>2]|0,c[j>>2]|0)|0)<<2)|0;u=(c[r>>2]|0)+((ea(c[q>>2]|0,c[j>>2]|0)|0)<<2)|0;De(t,e,c[p>>2]|0,u,c[h>>2]|0)|0;u=c[k>>2]|0;e=c[s>>2]|0;v=c[j>>2]|0;v=v*6|0;v=e+(v<<2)|0;v=v+8|0;e=c[s>>2]|0;f=c[j>>2]|0;f=f*3|0;f=e+(f<<2)|0;f=f+4|0;e=c[s>>2]|0;d=c[j>>2]|0;a=c[p>>2]|0;b=c[h>>2]|0;b=a+b|0;a=c[m>>2]|0;t=c[s>>2]|0;g=c[j>>2]|0;g=g*9|0;g=t+(g<<2)|0;g=g+12|0;Sf(u,v,f,e,d,b,a,g);i=l;return}else{e=(c[r>>2]|0)+((ea(c[q>>2]|0,c[j>>2]|0)|0)<<2)|0;u=(c[o>>2]|0)+((ea(c[n>>2]|0,c[j>>2]|0)|0)<<2)|0;De(t,e,c[h>>2]|0,u,c[p>>2]|0)|0;u=c[k>>2]|0;e=c[s>>2]|0;v=c[j>>2]|0;v=v*6|0;v=e+(v<<2)|0;v=v+8|0;e=c[s>>2]|0;f=c[j>>2]|0;f=f*3|0;f=e+(f<<2)|0;f=f+4|0;e=c[s>>2]|0;d=c[j>>2]|0;a=c[p>>2]|0;b=c[h>>2]|0;b=a+b|0;a=c[m>>2]|0;t=c[s>>2]|0;g=c[j>>2]|0;g=g*9|0;g=t+(g<<2)|0;g=g+12|0;Sf(u,v,f,e,d,b,a,g);i=l;return}}function yf(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+32|0;k=f+20|0;l=f+16|0;m=f+12|0;h=f+8|0;g=f+4|0;j=f;c[k>>2]=a;c[l>>2]=b;c[m>>2]=d;c[h>>2]=e;c[g>>2]=1+((((c[m>>2]|0)-1|0)>>>0)/6|0);c[j>>2]=(c[m>>2]|0)-((c[g>>2]|0)*5|0);Lf((c[k>>2]|0)+((c[g>>2]|0)*9<<2)+8|0,(c[k>>2]|0)+((c[g>>2]|0)*7<<2)|0,5,c[l>>2]|0,c[g>>2]|0,c[j>>2]|0,1,c[k>>2]|0)|0;Cf(c[k>>2]|0,(c[k>>2]|0)+((c[g>>2]|0)*7<<2)|0,(c[g>>2]|0)+1|0,(c[h>>2]|0)+((c[g>>2]|0)*9<<2)+12|0);Cf(c[h>>2]|0,(c[k>>2]|0)+((c[g>>2]|0)*9<<2)+8|0,(c[g>>2]|0)+1|0,(c[h>>2]|0)+((c[g>>2]|0)*9<<2)+12|0);Bf(c[h>>2]|0,(c[g>>2]<<1)+1|0,c[k>>2]|0,0,c[g>>2]|0,1,0);If((c[k>>2]|0)+((c[g>>2]|0)*9<<2)+8|0,(c[k>>2]|0)+((c[g>>2]|0)*7<<2)|0,5,c[l>>2]|0,c[g>>2]|0,c[j>>2]|0,c[k>>2]|0)|0;Cf(c[k>>2]|0,(c[k>>2]|0)+((c[g>>2]|0)*7<<2)|0,(c[g>>2]|0)+1|0,(c[h>>2]|0)+((c[g>>2]|0)*9<<2)+12|0);Cf((c[h>>2]|0)+((c[g>>2]|0)*3<<2)+4|0,(c[k>>2]|0)+((c[g>>2]|0)*9<<2)+8|0,(c[g>>2]|0)+1|0,(c[h>>2]|0)+((c[g>>2]|0)*9<<2)+12|0);Bf((c[h>>2]|0)+((c[g>>2]|0)*3<<2)+4|0,(c[g>>2]<<1)+1|0,c[k>>2]|0,0,c[g>>2]|0,0,0);Kf((c[k>>2]|0)+((c[g>>2]|0)*9<<2)+8|0,(c[k>>2]|0)+((c[g>>2]|0)*7<<2)|0,5,c[l>>2]|0,c[g>>2]|0,c[j>>2]|0,2,c[k>>2]|0)|0;Cf(c[k>>2]|0,(c[k>>2]|0)+((c[g>>2]|0)*7<<2)|0,(c[g>>2]|0)+1|0,(c[h>>2]|0)+((c[g>>2]|0)*9<<2)+12|0);Cf((c[h>>2]|0)+((c[g>>2]|0)*6<<2)+8|0,(c[k>>2]|0)+((c[g>>2]|0)*9<<2)+8|0,(c[g>>2]|0)+1|0,(c[h>>2]|0)+((c[g>>2]|0)*9<<2)+12|0);Bf((c[h>>2]|0)+((c[g>>2]|0)*6<<2)+8|0,(c[g>>2]<<1)+1|0,c[k>>2]|0,0,c[g>>2]|0,2,4);Lf((c[k>>2]|0)+((c[g>>2]|0)*9<<2)+8|0,(c[k>>2]|0)+((c[g>>2]|0)*7<<2)|0,5,c[l>>2]|0,c[g>>2]|0,c[j>>2]|0,2,c[k>>2]|0)|0;Cf(c[k>>2]|0,(c[k>>2]|0)+((c[g>>2]|0)*7<<2)|0,(c[g>>2]|0)+1|0,(c[h>>2]|0)+((c[g>>2]|0)*9<<2)+12|0);Cf((c[k>>2]|0)+((c[g>>2]|0)*3<<2)|0,(c[k>>2]|0)+((c[g>>2]|0)*9<<2)+8|0,(c[g>>2]|0)+1|0,(c[h>>2]|0)+((c[g>>2]|0)*9<<2)+12|0);Bf((c[k>>2]|0)+((c[g>>2]|0)*3<<2)|0,(c[g>>2]<<1)+1|0,c[k>>2]|0,0,c[g>>2]|0,2,0);Jf((c[k>>2]|0)+((c[g>>2]|0)*9<<2)+8|0,(c[k>>2]|0)+((c[g>>2]|0)*7<<2)|0,5,c[l>>2]|0,c[g>>2]|0,c[j>>2]|0,c[k>>2]|0)|0;Cf(c[k>>2]|0,(c[k>>2]|0)+((c[g>>2]|0)*7<<2)|0,(c[g>>2]|0)+1|0,(c[h>>2]|0)+((c[g>>2]|0)*9<<2)+12|0);Cf((c[k>>2]|0)+((c[g>>2]|0)*7<<2)|0,(c[k>>2]|0)+((c[g>>2]|0)*9<<2)+8|0,(c[g>>2]|0)+1|0,(c[h>>2]|0)+((c[g>>2]|0)*9<<2)+12|0);Bf((c[k>>2]|0)+((c[g>>2]|0)*7<<2)|0,(c[g>>2]<<1)+1|0,c[k>>2]|0,0,c[g>>2]|0,1,2);Cf(c[k>>2]|0,c[l>>2]|0,c[g>>2]|0,(c[h>>2]|0)+((c[g>>2]|0)*9<<2)+12|0);Sf(c[k>>2]|0,(c[h>>2]|0)+((c[g>>2]|0)*6<<2)+8|0,(c[h>>2]|0)+((c[g>>2]|0)*3<<2)+4|0,c[h>>2]|0,c[g>>2]|0,c[j>>2]<<1,0,(c[h>>2]|0)+((c[g>>2]|0)*9<<2)+12|0);i=f;return}function zf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;s=i;i=i+64|0;h=s+48|0;o=s+44|0;v=s+40|0;q=s+36|0;u=s+32|0;p=s+28|0;n=s+24|0;r=s+20|0;m=s+16|0;j=s+12|0;l=s+8|0;k=s+4|0;t=s;c[h>>2]=a;c[o>>2]=b;c[v>>2]=d;c[q>>2]=e;c[u>>2]=f;c[p>>2]=g;do{if((((c[v>>2]|0)==(c[u>>2]|0)|0)!=0|0)==0?((c[v>>2]|0)*10|0)>=((c[u>>2]>>1)*21|0):0){do{if(((c[v>>2]|0)*13|0)>=(c[u>>2]<<4|0)){if(((c[v>>2]|0)*10|0)<((c[u>>2]>>1)*27|0)){c[j>>2]=9;c[l>>2]=7;break}if(((c[v>>2]|0)*10|0)<((c[u>>2]>>1)*33|0)){c[j>>2]=10;c[l>>2]=7;break}if((c[v>>2]<<2|0)<((c[u>>2]|0)*7|0)){c[j>>2]=10;c[l>>2]=6;break}a=((c[v>>2]|0)*6|0)<((c[u>>2]|0)*13|0);c[j>>2]=11;if(a){c[l>>2]=6;break}else{c[l>>2]=5;break}}else{c[j>>2]=9;c[l>>2]=8}}while(0);c[k>>2]=(c[j>>2]|0)+(c[l>>2]|0)&1;a=ea(c[l>>2]|0,c[v>>2]|0)|0;if((a|0)>=(ea(c[j>>2]|0,c[u>>2]|0)|0)){g=(((c[v>>2]|0)-1|0)>>>0)/((c[j>>2]|0)>>>0)|0}else{g=(((c[u>>2]|0)-1|0)>>>0)/((c[l>>2]|0)>>>0)|0}c[n>>2]=1+g;c[j>>2]=(c[j>>2]|0)+ -1;c[l>>2]=(c[l>>2]|0)+ -1;c[r>>2]=(c[v>>2]|0)-(ea(c[j>>2]|0,c[n>>2]|0)|0);c[m>>2]=(c[u>>2]|0)-(ea(c[l>>2]|0,c[n>>2]|0)|0);if((c[k>>2]|0)!=0){if((((c[r>>2]|0)<1|0)!=0|0)!=0){c[j>>2]=(c[j>>2]|0)+ -1;c[r>>2]=(c[r>>2]|0)+(c[n>>2]|0);c[k>>2]=0;break}if((((c[m>>2]|0)<1|0)!=0|0)!=0){c[l>>2]=(c[l>>2]|0)+ -1;c[m>>2]=(c[m>>2]|0)+(c[n>>2]|0);c[k>>2]=0}}}else{w=3}}while(0);if((w|0)==3){c[k>>2]=0;c[n>>2]=1+((c[v>>2]|0)-1>>3);c[l>>2]=7;c[j>>2]=7;c[r>>2]=(c[v>>2]|0)-((c[n>>2]|0)*7|0);c[m>>2]=(c[u>>2]|0)-((c[n>>2]|0)*7|0)}a=Lf((c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,c[j>>2]|0,c[o>>2]|0,c[n>>2]|0,c[r>>2]|0,3,c[h>>2]|0)|0;c[t>>2]=a^(Lf((c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,c[l>>2]|0,c[q>>2]|0,c[n>>2]|0,c[m>>2]|0,3,c[h>>2]|0)|0);do{if(((c[n>>2]|0)+1|0)>=100){if(((c[n>>2]|0)+1|0)<300){qf(c[h>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[n>>2]|0)+1|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);qf(c[p>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}e=c[h>>2]|0;f=(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0;g=(c[n>>2]|0)+1|0;w=(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0;v=(c[n>>2]|0)+1|0;u=(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0;if(((c[n>>2]|0)+1|0)>=350){xf(e,f,g,w,v,u);xf(c[p>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}else{wf(e,f,g,w,v,u);wf(c[p>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}}else{hf(c[h>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[n>>2]|0)+1|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);hf(c[p>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0)}}while(0);Bf(c[p>>2]|0,(c[n>>2]<<1)+2|0,c[h>>2]|0,c[t>>2]|0,c[n>>2]|0,(1+(c[k>>2]|0)|0)*3|0,(c[k>>2]|0)*3|0);a=Lf((c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,c[j>>2]|0,c[o>>2]|0,c[n>>2]|0,c[r>>2]|0,2,c[h>>2]|0)|0;c[t>>2]=a^(Lf((c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,c[l>>2]|0,c[q>>2]|0,c[n>>2]|0,c[m>>2]|0,2,c[h>>2]|0)|0);do{if(((c[n>>2]|0)+1|0)>=100){if(((c[n>>2]|0)+1|0)<300){qf(c[h>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[n>>2]|0)+1|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);qf((c[p>>2]|0)+((c[n>>2]|0)*3<<2)+4|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}e=c[h>>2]|0;f=(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0;g=(c[n>>2]|0)+1|0;w=(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0;v=(c[n>>2]|0)+1|0;u=(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0;if(((c[n>>2]|0)+1|0)>=350){xf(e,f,g,w,v,u);xf((c[p>>2]|0)+((c[n>>2]|0)*3<<2)+4|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}else{wf(e,f,g,w,v,u);wf((c[p>>2]|0)+((c[n>>2]|0)*3<<2)+4|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}}else{hf(c[h>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[n>>2]|0)+1|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);hf((c[p>>2]|0)+((c[n>>2]|0)*3<<2)+4|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0)}}while(0);Bf((c[p>>2]|0)+((c[n>>2]|0)*3<<2)+4|0,(c[n>>2]<<1)+1|0,c[h>>2]|0,c[t>>2]|0,c[n>>2]|0,1+(c[k>>2]|0)<<1,c[k>>2]<<1);a=Jf((c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,c[j>>2]|0,c[o>>2]|0,c[n>>2]|0,c[r>>2]|0,c[h>>2]|0)|0;c[t>>2]=a^(Jf((c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,c[l>>2]|0,c[q>>2]|0,c[n>>2]|0,c[m>>2]|0,c[h>>2]|0)|0);do{if(((c[n>>2]|0)+1|0)>=100){if(((c[n>>2]|0)+1|0)<300){qf(c[h>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[n>>2]|0)+1|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);qf((c[p>>2]|0)+((c[n>>2]|0)*6<<2)+8|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}e=c[h>>2]|0;f=(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0;g=(c[n>>2]|0)+1|0;w=(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0;v=(c[n>>2]|0)+1|0;u=(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0;if(((c[n>>2]|0)+1|0)>=350){xf(e,f,g,w,v,u);xf((c[p>>2]|0)+((c[n>>2]|0)*6<<2)+8|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}else{wf(e,f,g,w,v,u);wf((c[p>>2]|0)+((c[n>>2]|0)*6<<2)+8|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}}else{hf(c[h>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[n>>2]|0)+1|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);hf((c[p>>2]|0)+((c[n>>2]|0)*6<<2)+8|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0)}}while(0);Bf((c[p>>2]|0)+((c[n>>2]|0)*6<<2)+8|0,(c[n>>2]<<1)+1|0,c[h>>2]|0,c[t>>2]|0,c[n>>2]|0,1,2);a=Kf((c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,c[j>>2]|0,c[o>>2]|0,c[n>>2]|0,c[r>>2]|0,3,c[h>>2]|0)|0;c[t>>2]=a^(Kf((c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,c[l>>2]|0,c[q>>2]|0,c[n>>2]|0,c[m>>2]|0,3,c[h>>2]|0)|0);do{if(((c[n>>2]|0)+1|0)>=100){if(((c[n>>2]|0)+1|0)<300){qf(c[h>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[n>>2]|0)+1|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);qf((c[p>>2]|0)+((c[n>>2]|0)*9<<2)+12|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}e=c[h>>2]|0;f=(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0;g=(c[n>>2]|0)+1|0;w=(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0;v=(c[n>>2]|0)+1|0;u=(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0;if(((c[n>>2]|0)+1|0)>=350){xf(e,f,g,w,v,u);xf((c[p>>2]|0)+((c[n>>2]|0)*9<<2)+12|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}else{wf(e,f,g,w,v,u);wf((c[p>>2]|0)+((c[n>>2]|0)*9<<2)+12|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}}else{hf(c[h>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[n>>2]|0)+1|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);hf((c[p>>2]|0)+((c[n>>2]|0)*9<<2)+12|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0)}}while(0);Bf((c[p>>2]|0)+((c[n>>2]|0)*9<<2)+12|0,(c[n>>2]<<1)+2|0,c[h>>2]|0,c[t>>2]|0,c[n>>2]|0,3,6);a=Lf((c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,c[j>>2]|0,c[o>>2]|0,c[n>>2]|0,c[r>>2]|0,1,c[h>>2]|0)|0;c[t>>2]=a^(Lf((c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,c[l>>2]|0,c[q>>2]|0,c[n>>2]|0,c[m>>2]|0,1,c[h>>2]|0)|0);do{if(((c[n>>2]|0)+1|0)>=100){if(((c[n>>2]|0)+1|0)<300){qf(c[h>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[n>>2]|0)+1|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);qf((c[h>>2]|0)+((c[n>>2]|0)*3<<2)|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}e=c[h>>2]|0;f=(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0;g=(c[n>>2]|0)+1|0;w=(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0;v=(c[n>>2]|0)+1|0;u=(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0;if(((c[n>>2]|0)+1|0)>=350){xf(e,f,g,w,v,u);xf((c[h>>2]|0)+((c[n>>2]|0)*3<<2)|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}else{wf(e,f,g,w,v,u);wf((c[h>>2]|0)+((c[n>>2]|0)*3<<2)|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}}else{hf(c[h>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[n>>2]|0)+1|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);hf((c[h>>2]|0)+((c[n>>2]|0)*3<<2)|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0)}}while(0);Bf((c[h>>2]|0)+((c[n>>2]|0)*3<<2)|0,(c[n>>2]<<1)+1|0,c[h>>2]|0,c[t>>2]|0,c[n>>2]|0,1+(c[k>>2]|0)|0,c[k>>2]|0);c[t>>2]=If((c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,c[j>>2]|0,c[o>>2]|0,c[n>>2]|0,c[r>>2]|0,c[h>>2]|0)|0;a=If((c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,c[l>>2]|0,c[q>>2]|0,c[n>>2]|0,c[m>>2]|0,c[h>>2]|0)|0;c[t>>2]=c[t>>2]^a;do{if(((c[n>>2]|0)+1|0)>=100){if(((c[n>>2]|0)+1|0)<300){qf(c[h>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[n>>2]|0)+1|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);qf((c[h>>2]|0)+((c[n>>2]|0)*7<<2)|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}e=c[h>>2]|0;f=(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0;g=(c[n>>2]|0)+1|0;w=(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0;v=(c[n>>2]|0)+1|0;u=(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0;if(((c[n>>2]|0)+1|0)>=350){xf(e,f,g,w,v,u);xf((c[h>>2]|0)+((c[n>>2]|0)*7<<2)|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}else{wf(e,f,g,w,v,u);wf((c[h>>2]|0)+((c[n>>2]|0)*7<<2)|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}}else{hf(c[h>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[n>>2]|0)+1|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);hf((c[h>>2]|0)+((c[n>>2]|0)*7<<2)|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0)}}while(0);Bf((c[h>>2]|0)+((c[n>>2]|0)*7<<2)|0,(c[n>>2]<<1)+1|0,c[h>>2]|0,c[t>>2]|0,c[n>>2]|0,0,0);a=Kf((c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,c[j>>2]|0,c[o>>2]|0,c[n>>2]|0,c[r>>2]|0,2,c[h>>2]|0)|0;c[t>>2]=a^(Kf((c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,c[l>>2]|0,c[q>>2]|0,c[n>>2]|0,c[m>>2]|0,2,c[h>>2]|0)|0);do{if(((c[n>>2]|0)+1|0)>=100){if(((c[n>>2]|0)+1|0)<300){qf(c[h>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[n>>2]|0)+1|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);qf((c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}u=c[h>>2]|0;e=(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0;f=(c[n>>2]|0)+1|0;g=(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0;w=(c[n>>2]|0)+1|0;v=(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0;if(((c[n>>2]|0)+1|0)>=350){xf(u,e,f,g,w,v);xf((c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}else{wf(u,e,f,g,w,v);wf((c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);break}}else{hf(c[h>>2]|0,(c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[n>>2]|0)+1|0,(c[h>>2]|0)+((c[n>>2]|0)*12<<2)+4|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0);hf((c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[h>>2]|0)+((c[n>>2]|0)*13<<2)+8|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0,(c[n>>2]|0)+1|0,(c[p>>2]|0)+((c[n>>2]|0)*13<<2)+20|0)}}while(0);Bf((c[h>>2]|0)+((c[n>>2]|0)*11<<2)|0,(c[n>>2]<<1)+1|0,c[h>>2]|0,c[t>>2]|0,c[n>>2]|0,2,4);do{if((c[n>>2]|0)>=100){if((c[n>>2]|0)<300){qf(c[h>>2]|0,c[o>>2]|0,c[n>>2]|0,c[q>>2]|0,c[n>>2]|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0);break}f=c[h>>2]|0;g=c[o>>2]|0;w=c[n>>2]|0;v=c[q>>2]|0;u=c[n>>2]|0;t=(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0;if((c[n>>2]|0)>=350){xf(f,g,w,v,u,t);break}else{wf(f,g,w,v,u,t);break}}else{hf(c[h>>2]|0,c[o>>2]|0,c[n>>2]|0,c[q>>2]|0,c[n>>2]|0,(c[p>>2]|0)+((c[n>>2]|0)*12<<2)+16|0)}}while(0);if((((c[k>>2]|0)!=0|0)!=0|0)==0){u=c[h>>2]|0;f=c[p>>2]|0;v=c[n>>2]|0;v=v*9|0;v=f+(v<<2)|0;v=v+12|0;f=c[p>>2]|0;w=c[n>>2]|0;w=w*6|0;w=f+(w<<2)|0;w=w+8|0;f=c[p>>2]|0;g=c[n>>2]|0;g=g*3|0;g=f+(g<<2)|0;g=g+4|0;f=c[p>>2]|0;e=c[n>>2]|0;b=c[r>>2]|0;d=c[m>>2]|0;d=b+d|0;b=c[k>>2]|0;t=c[p>>2]|0;a=c[n>>2]|0;a=a*12|0;a=t+(a<<2)|0;a=a+16|0;Uf(u,v,w,g,f,e,d,b,a);i=s;return}t=(c[h>>2]|0)+((c[n>>2]|0)*15<<2)|0;if((c[r>>2]|0)>(c[m>>2]|0)){f=(c[o>>2]|0)+((ea(c[j>>2]|0,c[n>>2]|0)|0)<<2)|0;u=(c[q>>2]|0)+((ea(c[l>>2]|0,c[n>>2]|0)|0)<<2)|0;De(t,f,c[r>>2]|0,u,c[m>>2]|0)|0;u=c[h>>2]|0;f=c[p>>2]|0;v=c[n>>2]|0;v=v*9|0;v=f+(v<<2)|0;v=v+12|0;f=c[p>>2]|0;w=c[n>>2]|0;w=w*6|0;w=f+(w<<2)|0;w=w+8|0;f=c[p>>2]|0;g=c[n>>2]|0;g=g*3|0;g=f+(g<<2)|0;g=g+4|0;f=c[p>>2]|0;e=c[n>>2]|0;b=c[r>>2]|0;d=c[m>>2]|0;d=b+d|0;b=c[k>>2]|0;t=c[p>>2]|0;a=c[n>>2]|0;a=a*12|0;a=t+(a<<2)|0;a=a+16|0;Uf(u,v,w,g,f,e,d,b,a);i=s;return}else{f=(c[q>>2]|0)+((ea(c[l>>2]|0,c[n>>2]|0)|0)<<2)|0;u=(c[o>>2]|0)+((ea(c[j>>2]|0,c[n>>2]|0)|0)<<2)|0;De(t,f,c[m>>2]|0,u,c[r>>2]|0)|0;u=c[h>>2]|0;f=c[p>>2]|0;v=c[n>>2]|0;v=v*9|0;v=f+(v<<2)|0;v=v+12|0;f=c[p>>2]|0;w=c[n>>2]|0;w=w*6|0;w=f+(w<<2)|0;w=w+8|0;f=c[p>>2]|0;g=c[n>>2]|0;g=g*3|0;g=f+(g<<2)|0;g=g+4|0;f=c[p>>2]|0;e=c[n>>2]|0;b=c[r>>2]|0;d=c[m>>2]|0;d=b+d|0;b=c[k>>2]|0;t=c[p>>2]|0;a=c[n>>2]|0;a=a*12|0;a=t+(a<<2)|0;a=a+16|0;Uf(u,v,w,g,f,e,d,b,a);i=s;return}}function Af(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;j=i;i=i+32|0;g=j+20|0;l=j+16|0;m=j+12|0;k=j+8|0;f=j+4|0;h=j;c[g>>2]=a;c[l>>2]=b;c[m>>2]=d;c[k>>2]=e;c[f>>2]=1+((c[m>>2]|0)-1>>3);c[h>>2]=(c[m>>2]|0)-((c[f>>2]|0)*7|0);Lf((c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,7,c[l>>2]|0,c[f>>2]|0,c[h>>2]|0,3,c[g>>2]|0)|0;do{if(((c[f>>2]|0)+1|0)>=120){if(((c[f>>2]|0)+1|0)<400){Ef(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Ef(c[k>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}if(((c[f>>2]|0)+1|0)<350){Ff(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Ff(c[k>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}e=c[g>>2]|0;a=(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0;b=(c[f>>2]|0)+1|0;d=(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0;if(((c[f>>2]|0)+1|0)>=450){Af(e,a,b,d);Af(c[k>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}else{yf(e,a,b,d);yf(c[k>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}}else{Cf(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Cf(c[k>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0)}}while(0);Bf(c[k>>2]|0,(c[f>>2]<<1)+2|0,c[g>>2]|0,0,c[f>>2]|0,3,0);Lf((c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,7,c[l>>2]|0,c[f>>2]|0,c[h>>2]|0,2,c[g>>2]|0)|0;do{if(((c[f>>2]|0)+1|0)>=120){if(((c[f>>2]|0)+1|0)<400){Ef(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Ef((c[k>>2]|0)+((c[f>>2]|0)*3<<2)+4|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}if(((c[f>>2]|0)+1|0)<350){Ff(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Ff((c[k>>2]|0)+((c[f>>2]|0)*3<<2)+4|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}e=c[g>>2]|0;a=(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0;b=(c[f>>2]|0)+1|0;d=(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0;if(((c[f>>2]|0)+1|0)>=450){Af(e,a,b,d);Af((c[k>>2]|0)+((c[f>>2]|0)*3<<2)+4|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}else{yf(e,a,b,d);yf((c[k>>2]|0)+((c[f>>2]|0)*3<<2)+4|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}}else{Cf(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Cf((c[k>>2]|0)+((c[f>>2]|0)*3<<2)+4|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0)}}while(0);Bf((c[k>>2]|0)+((c[f>>2]|0)*3<<2)+4|0,(c[f>>2]<<1)+1|0,c[g>>2]|0,0,c[f>>2]|0,2,0);Jf((c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,7,c[l>>2]|0,c[f>>2]|0,c[h>>2]|0,c[g>>2]|0)|0;do{if(((c[f>>2]|0)+1|0)>=120){if(((c[f>>2]|0)+1|0)<400){Ef(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Ef((c[k>>2]|0)+((c[f>>2]|0)*6<<2)+8|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}if(((c[f>>2]|0)+1|0)<350){Ff(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Ff((c[k>>2]|0)+((c[f>>2]|0)*6<<2)+8|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}d=c[g>>2]|0;e=(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0;a=(c[f>>2]|0)+1|0;b=(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0;if(((c[f>>2]|0)+1|0)>=450){Af(d,e,a,b);Af((c[k>>2]|0)+((c[f>>2]|0)*6<<2)+8|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}else{yf(d,e,a,b);yf((c[k>>2]|0)+((c[f>>2]|0)*6<<2)+8|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}}else{Cf(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Cf((c[k>>2]|0)+((c[f>>2]|0)*6<<2)+8|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0)}}while(0);Bf((c[k>>2]|0)+((c[f>>2]|0)*6<<2)+8|0,(c[f>>2]<<1)+1|0,c[g>>2]|0,0,c[f>>2]|0,1,2);Kf((c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,7,c[l>>2]|0,c[f>>2]|0,c[h>>2]|0,3,c[g>>2]|0)|0;do{if(((c[f>>2]|0)+1|0)>=120){if(((c[f>>2]|0)+1|0)<400){Ef(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Ef((c[k>>2]|0)+((c[f>>2]|0)*9<<2)+12|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}if(((c[f>>2]|0)+1|0)<350){Ff(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Ff((c[k>>2]|0)+((c[f>>2]|0)*9<<2)+12|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}e=c[g>>2]|0;a=(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0;b=(c[f>>2]|0)+1|0;d=(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0;if(((c[f>>2]|0)+1|0)>=450){Af(e,a,b,d);Af((c[k>>2]|0)+((c[f>>2]|0)*9<<2)+12|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}else{yf(e,a,b,d);yf((c[k>>2]|0)+((c[f>>2]|0)*9<<2)+12|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}}else{Cf(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Cf((c[k>>2]|0)+((c[f>>2]|0)*9<<2)+12|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0)}}while(0);Bf((c[k>>2]|0)+((c[f>>2]|0)*9<<2)+12|0,(c[f>>2]<<1)+2|0,c[g>>2]|0,0,c[f>>2]|0,3,6);Lf((c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,7,c[l>>2]|0,c[f>>2]|0,c[h>>2]|0,1,c[g>>2]|0)|0;do{if(((c[f>>2]|0)+1|0)>=120){if(((c[f>>2]|0)+1|0)<400){Ef(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Ef((c[g>>2]|0)+((c[f>>2]|0)*3<<2)|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}if(((c[f>>2]|0)+1|0)<350){Ff(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Ff((c[g>>2]|0)+((c[f>>2]|0)*3<<2)|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}e=c[g>>2]|0;a=(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0;b=(c[f>>2]|0)+1|0;d=(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0;if(((c[f>>2]|0)+1|0)>=450){Af(e,a,b,d);Af((c[g>>2]|0)+((c[f>>2]|0)*3<<2)|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}else{yf(e,a,b,d);yf((c[g>>2]|0)+((c[f>>2]|0)*3<<2)|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}}else{Cf(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Cf((c[g>>2]|0)+((c[f>>2]|0)*3<<2)|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0)}}while(0);Bf((c[g>>2]|0)+((c[f>>2]|0)*3<<2)|0,(c[f>>2]<<1)+1|0,c[g>>2]|0,0,c[f>>2]|0,1,0);If((c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,7,c[l>>2]|0,c[f>>2]|0,c[h>>2]|0,c[g>>2]|0)|0;do{if(((c[f>>2]|0)+1|0)>=120){if(((c[f>>2]|0)+1|0)<400){Ef(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Ef((c[g>>2]|0)+((c[f>>2]|0)*7<<2)|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}if(((c[f>>2]|0)+1|0)<350){Ff(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Ff((c[g>>2]|0)+((c[f>>2]|0)*7<<2)|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}e=c[g>>2]|0;a=(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0;b=(c[f>>2]|0)+1|0;d=(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0;if(((c[f>>2]|0)+1|0)>=450){Af(e,a,b,d);Af((c[g>>2]|0)+((c[f>>2]|0)*7<<2)|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}else{yf(e,a,b,d);yf((c[g>>2]|0)+((c[f>>2]|0)*7<<2)|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}}else{Cf(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Cf((c[g>>2]|0)+((c[f>>2]|0)*7<<2)|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0)}}while(0);Bf((c[g>>2]|0)+((c[f>>2]|0)*7<<2)|0,(c[f>>2]<<1)+1|0,c[g>>2]|0,0,c[f>>2]|0,0,0);Kf((c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,7,c[l>>2]|0,c[f>>2]|0,c[h>>2]|0,2,c[g>>2]|0)|0;do{if(((c[f>>2]|0)+1|0)>=120){if(((c[f>>2]|0)+1|0)<400){Ef(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Ef((c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}if(((c[f>>2]|0)+1|0)<350){Ff(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Ff((c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}e=c[g>>2]|0;a=(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0;b=(c[f>>2]|0)+1|0;d=(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0;if(((c[f>>2]|0)+1|0)>=450){Af(e,a,b,d);Af((c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}else{yf(e,a,b,d);yf((c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);break}}else{Cf(c[g>>2]|0,(c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);Cf((c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[g>>2]|0)+((c[f>>2]|0)*13<<2)+8|0,(c[f>>2]|0)+1|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0)}}while(0);Bf((c[g>>2]|0)+((c[f>>2]|0)*11<<2)|0,(c[f>>2]<<1)+1|0,c[g>>2]|0,0,c[f>>2]|0,2,4);if((c[f>>2]|0)<120){Cf(c[g>>2]|0,c[l>>2]|0,c[f>>2]|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);n=c[g>>2]|0;b=c[k>>2]|0;g=c[f>>2]|0;g=g*9|0;g=b+(g<<2)|0;g=g+12|0;b=c[k>>2]|0;l=c[f>>2]|0;l=l*6|0;l=b+(l<<2)|0;l=l+8|0;b=c[k>>2]|0;d=c[f>>2]|0;d=d*3|0;d=b+(d<<2)|0;d=d+4|0;b=c[k>>2]|0;a=c[f>>2]|0;e=c[h>>2]|0;e=e<<1;k=c[k>>2]|0;m=c[f>>2]|0;m=m*12|0;m=k+(m<<2)|0;m=m+16|0;Uf(n,g,l,d,b,a,e,0,m);i=j;return}if((c[f>>2]|0)<400){Ef(c[g>>2]|0,c[l>>2]|0,c[f>>2]|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);g=c[g>>2]|0;a=c[k>>2]|0;l=c[f>>2]|0;l=l*9|0;l=a+(l<<2)|0;l=l+12|0;a=c[k>>2]|0;d=c[f>>2]|0;d=d*6|0;d=a+(d<<2)|0;d=d+8|0;a=c[k>>2]|0;b=c[f>>2]|0;b=b*3|0;b=a+(b<<2)|0;b=b+4|0;a=c[k>>2]|0;e=c[f>>2]|0;m=c[h>>2]|0;m=m<<1;k=c[k>>2]|0;n=c[f>>2]|0;n=n*12|0;n=k+(n<<2)|0;n=n+16|0;Uf(g,l,d,b,a,e,m,0,n);i=j;return}if((c[f>>2]|0)<350){Ff(c[g>>2]|0,c[l>>2]|0,c[f>>2]|0,(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0);g=c[g>>2]|0;a=c[k>>2]|0;l=c[f>>2]|0;l=l*9|0;l=a+(l<<2)|0;l=l+12|0;a=c[k>>2]|0;d=c[f>>2]|0;d=d*6|0;d=a+(d<<2)|0;d=d+8|0;a=c[k>>2]|0;b=c[f>>2]|0;b=b*3|0;b=a+(b<<2)|0;b=b+4|0;a=c[k>>2]|0;e=c[f>>2]|0;m=c[h>>2]|0;m=m<<1;k=c[k>>2]|0;n=c[f>>2]|0;n=n*12|0;n=k+(n<<2)|0;n=n+16|0;Uf(g,l,d,b,a,e,m,0,n);i=j;return}d=c[g>>2]|0;a=c[l>>2]|0;b=c[f>>2]|0;l=(c[k>>2]|0)+((c[f>>2]|0)*12<<2)+16|0;if((c[f>>2]|0)>=450){Af(d,a,b,l);g=c[g>>2]|0;a=c[k>>2]|0;l=c[f>>2]|0;l=l*9|0;l=a+(l<<2)|0;l=l+12|0;a=c[k>>2]|0;d=c[f>>2]|0;d=d*6|0;d=a+(d<<2)|0;d=d+8|0;a=c[k>>2]|0;b=c[f>>2]|0;b=b*3|0;b=a+(b<<2)|0;b=b+4|0;a=c[k>>2]|0;e=c[f>>2]|0;m=c[h>>2]|0;m=m<<1;k=c[k>>2]|0;n=c[f>>2]|0;n=n*12|0;n=k+(n<<2)|0;n=n+16|0;Uf(g,l,d,b,a,e,m,0,n);i=j;return}else{yf(d,a,b,l);g=c[g>>2]|0;a=c[k>>2]|0;l=c[f>>2]|0;l=l*9|0;l=a+(l<<2)|0;l=l+12|0;a=c[k>>2]|0;d=c[f>>2]|0;d=d*6|0;d=a+(d<<2)|0;d=d+8|0;a=c[k>>2]|0;b=c[f>>2]|0;b=b*3|0;b=a+(b<<2)|0;b=b+4|0;a=c[k>>2]|0;e=c[f>>2]|0;m=c[h>>2]|0;m=m<<1;k=c[k>>2]|0;n=c[f>>2]|0;n=n*12|0;n=k+(n<<2)|0;n=n+16|0;Uf(g,l,d,b,a,e,m,0,n);i=j;return}}function Bf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;m=i;i=i+32|0;p=m+24|0;l=m+20|0;k=m+16|0;q=m+12|0;j=m+8|0;o=m+4|0;n=m;c[p>>2]=a;c[l>>2]=b;c[k>>2]=d;c[q>>2]=e;c[j>>2]=f;c[o>>2]=g;c[n>>2]=h;e=c[k>>2]|0;h=c[p>>2]|0;g=c[k>>2]|0;f=c[l>>2]|0;if((c[q>>2]|0)!=0){te(e,h,g,f)|0;ye(c[k>>2]|0,c[k>>2]|0,c[l>>2]|0,1)|0}else{qe(e,h,g,f)|0;ye(c[k>>2]|0,c[k>>2]|0,c[l>>2]|0,1)|0}te(c[p>>2]|0,c[p>>2]|0,c[k>>2]|0,c[l>>2]|0)|0;if((c[o>>2]|0)>0){ye(c[p>>2]|0,c[p>>2]|0,c[l>>2]|0,c[o>>2]|0)|0}if((c[n>>2]|0)>0){ye(c[k>>2]|0,c[k>>2]|0,c[l>>2]|0,c[n>>2]|0)|0}q=qe((c[p>>2]|0)+(c[j>>2]<<2)|0,(c[p>>2]|0)+(c[j>>2]<<2)|0,c[k>>2]|0,(c[l>>2]|0)-(c[j>>2]|0)|0)|0;c[(c[p>>2]|0)+(c[l>>2]<<2)>>2]=q;pe((c[p>>2]|0)+(c[l>>2]<<2)|0,(c[k>>2]|0)+(c[l>>2]<<2)+(0-(c[j>>2]|0)<<2)|0,c[j>>2]|0,c[(c[p>>2]|0)+(c[l>>2]<<2)>>2]|0)|0;i=m;return}function Cf(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;j=i;i=i+80|0;o=j+64|0;s=j+60|0;w=j+56|0;q=j+52|0;l=j+44|0;p=j+40|0;g=j+36|0;n=j+32|0;t=j+28|0;u=j+24|0;v=j+20|0;r=j+16|0;m=j+12|0;h=j+8|0;k=j+4|0;f=j;c[o>>2]=a;c[s>>2]=b;c[w>>2]=d;c[q>>2]=e;c[j+48>>2]=1;c[p>>2]=c[w>>2]>>1;c[l>>2]=(c[w>>2]|0)-(c[p>>2]|0);c[t>>2]=c[o>>2];e=c[s>>2]|0;a:do{if((c[p>>2]|0)==(c[l>>2]|0)){w=(ff(e,(c[s>>2]|0)+(c[l>>2]<<2)|0,c[l>>2]|0)|0)<0;v=c[t>>2]|0;u=c[s>>2]|0;if(w){te(v,u+(c[l>>2]<<2)|0,c[s>>2]|0,c[l>>2]|0)|0;break}else{te(v,u,(c[s>>2]|0)+(c[l>>2]<<2)|0,c[l>>2]|0)|0;break}}else{if((Df(e+(c[p>>2]<<2)|0,(c[l>>2]|0)-(c[p>>2]|0)|0)|0)!=0?(ff(c[s>>2]|0,(c[s>>2]|0)+(c[l>>2]<<2)|0,c[p>>2]|0)|0)<0:0){te(c[t>>2]|0,(c[s>>2]|0)+(c[l>>2]<<2)|0,c[s>>2]|0,c[p>>2]|0)|0;if(((c[l>>2]|0)-(c[p>>2]|0)|0)==0){break}c[u>>2]=(c[t>>2]|0)+(c[p>>2]<<2);c[v>>2]=(c[l>>2]|0)-(c[p>>2]|0);while(1){w=c[u>>2]|0;c[u>>2]=w+4;c[w>>2]=0;w=(c[v>>2]|0)+ -1|0;c[v>>2]=w;if((w|0)==0){break a}}}re(c[t>>2]|0,c[s>>2]|0,c[l>>2]|0,(c[s>>2]|0)+(c[l>>2]<<2)|0,c[p>>2]|0)|0}}while(0);u=c[q>>2]|0;v=c[t>>2]|0;t=c[l>>2]|0;if((c[l>>2]|0)>=50){Cf(u,v,t,(c[q>>2]|0)+(c[l>>2]<<1<<2)|0)}else{Ze(u,v,t)}v=(c[o>>2]|0)+(c[l>>2]<<1<<2)|0;u=(c[s>>2]|0)+(c[l>>2]<<2)|0;t=c[p>>2]|0;if((c[p>>2]|0)>=50){Cf(v,u,t,(c[q>>2]|0)+(c[l>>2]<<1<<2)|0)}else{Ze(v,u,t)}t=c[o>>2]|0;s=c[s>>2]|0;u=c[l>>2]|0;if((c[l>>2]|0)>=50){Cf(t,s,u,(c[q>>2]|0)+(c[l>>2]<<1<<2)|0)}else{Ze(t,s,u)}c[g>>2]=qe((c[o>>2]|0)+(c[l>>2]<<1<<2)|0,(c[o>>2]|0)+(c[l>>2]<<2)|0,(c[o>>2]|0)+(c[l>>2]<<1<<2)|0,c[l>>2]|0)|0;w=c[g>>2]|0;c[n>>2]=w+(qe((c[o>>2]|0)+(c[l>>2]<<2)|0,(c[o>>2]|0)+(c[l>>2]<<1<<2)|0,c[o>>2]|0,c[l>>2]|0)|0);w=oe((c[o>>2]|0)+(c[l>>2]<<1<<2)|0,(c[o>>2]|0)+(c[l>>2]<<1<<2)|0,c[l>>2]|0,(c[o>>2]|0)+(c[l>>2]<<1<<2)+(c[l>>2]<<2)|0,(c[p>>2]|0)+(c[p>>2]|0)-(c[l>>2]|0)|0)|0;c[g>>2]=(c[g>>2]|0)+w;w=te((c[o>>2]|0)+(c[l>>2]<<2)|0,(c[o>>2]|0)+(c[l>>2]<<2)|0,c[q>>2]|0,c[l>>2]<<1)|0;c[g>>2]=(c[g>>2]|0)-w;c[m>>2]=(c[o>>2]|0)+(c[l>>2]<<1<<2);c[r>>2]=(c[c[m>>2]>>2]|0)+(c[n>>2]|0);c[c[m>>2]>>2]=c[r>>2];if((c[r>>2]|0)>>>0<(c[n>>2]|0)>>>0){do{a=(c[m>>2]|0)+4|0;c[m>>2]=a;w=(c[a>>2]|0)+1|0;c[a>>2]=w}while((w|0)==0)}l=(c[o>>2]|0)+((c[l>>2]|0)*3<<2)|0;if((((c[g>>2]|0)>>>0<=2|0)!=0|0)==0){c[f>>2]=l;do{a=c[f>>2]|0;c[f>>2]=a+4;w=c[a>>2]|0;c[a>>2]=w+ -1}while((w|0)==0);i=j;return}c[k>>2]=l;c[h>>2]=(c[c[k>>2]>>2]|0)+(c[g>>2]|0);c[c[k>>2]>>2]=c[h>>2];if(!((c[h>>2]|0)>>>0<(c[g>>2]|0)>>>0)){i=j;return}do{a=(c[k>>2]|0)+4|0;c[k>>2]=a;w=(c[a>>2]|0)+1|0;c[a>>2]=w}while((w|0)==0);i=j;return}function Df(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;e=i;i=i+16|0;d=e+8|0;f=e+4|0;g=e;c[f>>2]=a;c[g>>2]=b;while(1){a=(c[g>>2]|0)+ -1|0;c[g>>2]=a;if((a|0)<0){b=5;break}if((c[(c[f>>2]|0)+(c[g>>2]<<2)>>2]|0)!=0){b=4;break}}if((b|0)==4){c[d>>2]=0;a=c[d>>2]|0;i=e;return a|0}else if((b|0)==5){c[d>>2]=1;a=c[d>>2]|0;i=e;return a|0}return 0}function Ef(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;k=i;i=i+64|0;f=k+48|0;m=k+44|0;s=k+40|0;h=k+36|0;l=k+28|0;g=k+24|0;n=k+20|0;j=k+16|0;r=k+12|0;o=k+8|0;q=k+4|0;p=k;c[f>>2]=a;c[m>>2]=b;c[s>>2]=d;c[h>>2]=e;c[k+32>>2]=1;c[l>>2]=(((c[s>>2]|0)+2|0)>>>0)/3|0;c[g>>2]=(c[s>>2]|0)-(c[l>>2]<<1);c[o>>2]=(c[h>>2]|0)+(c[l>>2]<<2<<2)+16;c[q>>2]=(c[h>>2]|0)+(c[l>>2]<<1<<2)+8;c[p>>2]=(c[f>>2]|0)+(c[l>>2]<<2)+4;c[r>>2]=c[h>>2];c[n>>2]=oe(c[r>>2]|0,c[m>>2]|0,c[l>>2]|0,(c[m>>2]|0)+(c[l>>2]<<1<<2)|0,c[g>>2]|0)|0;e=c[n>>2]|0;e=e+(qe(c[o>>2]|0,c[r>>2]|0,(c[m>>2]|0)+(c[l>>2]<<2)|0,c[l>>2]|0)|0)|0;c[(c[o>>2]|0)+(c[l>>2]<<2)>>2]=e;if((c[n>>2]|0)==0?(ff(c[r>>2]|0,(c[m>>2]|0)+(c[l>>2]<<2)|0,c[l>>2]|0)|0)<0:0){te(c[q>>2]|0,(c[m>>2]|0)+(c[l>>2]<<2)|0,c[r>>2]|0,c[l>>2]|0)|0;c[(c[q>>2]|0)+(c[l>>2]<<2)>>2]=0}else{s=te(c[q>>2]|0,c[r>>2]|0,(c[m>>2]|0)+(c[l>>2]<<2)|0,c[l>>2]|0)|0;c[n>>2]=(c[n>>2]|0)-s;c[(c[q>>2]|0)+(c[l>>2]<<2)>>2]=c[n>>2]}c[n>>2]=qe(c[p>>2]|0,(c[m>>2]|0)+(c[l>>2]<<1<<2)|0,c[o>>2]|0,c[g>>2]|0)|0;if((c[g>>2]|0)!=(c[l>>2]|0)){c[n>>2]=pe((c[p>>2]|0)+(c[g>>2]<<2)|0,(c[o>>2]|0)+(c[g>>2]<<2)|0,(c[l>>2]|0)-(c[g>>2]|0)|0,c[n>>2]|0)|0}c[n>>2]=(c[n>>2]|0)+(c[(c[o>>2]|0)+(c[l>>2]<<2)>>2]|0);s=c[n>>2]<<1;c[n>>2]=s+(xe(c[p>>2]|0,c[p>>2]|0,c[l>>2]|0,1)|0);s=te(c[p>>2]|0,c[p>>2]|0,c[m>>2]|0,c[l>>2]|0)|0;c[n>>2]=(c[n>>2]|0)-s;c[(c[p>>2]|0)+(c[l>>2]<<2)>>2]=c[n>>2];do{if(((c[l>>2]|0)+1|0)>=50){r=c[h>>2]|0;d=c[q>>2]|0;q=(c[l>>2]|0)+1|0;b=(c[h>>2]|0)+((c[l>>2]|0)*5<<2)+20|0;if(((c[l>>2]|0)+1|0)>=120){Ef(r,d,q,b);break}else{Cf(r,d,q,b);break}}else{Ze(c[h>>2]|0,c[q>>2]|0,(c[l>>2]|0)+1|0)}}while(0);do{if(((c[l>>2]|0)+1|0)>=50){q=(c[h>>2]|0)+(c[l>>2]<<1<<2)+4|0;d=c[p>>2]|0;p=(c[l>>2]|0)+1|0;r=(c[h>>2]|0)+((c[l>>2]|0)*5<<2)+20|0;if(((c[l>>2]|0)+1|0)>=120){Ef(q,d,p,r);break}else{Cf(q,d,p,r);break}}else{Ze((c[h>>2]|0)+(c[l>>2]<<1<<2)+4|0,c[p>>2]|0,(c[l>>2]|0)+1|0)}}while(0);do{if((c[g>>2]|0)>=50){d=(c[f>>2]|0)+(c[l>>2]<<2<<2)|0;r=(c[m>>2]|0)+(c[l>>2]<<1<<2)|0;q=c[g>>2]|0;p=(c[h>>2]|0)+((c[l>>2]|0)*5<<2)+20|0;if((c[g>>2]|0)>=120){Ef(d,r,q,p);break}else{Cf(d,r,q,p);break}}else{Ze((c[f>>2]|0)+(c[l>>2]<<2<<2)|0,(c[m>>2]|0)+(c[l>>2]<<1<<2)|0,c[g>>2]|0)}}while(0);c[j>>2]=c[(c[f>>2]|0)+(c[l>>2]<<2<<2)>>2];c[n>>2]=c[(c[f>>2]|0)+(c[l>>2]<<2<<2)+4>>2];do{if(((c[l>>2]|0)+1|0)>=50){p=(c[f>>2]|0)+(c[l>>2]<<1<<2)|0;q=c[o>>2]|0;o=(c[l>>2]|0)+1|0;r=(c[h>>2]|0)+((c[l>>2]|0)*5<<2)+20|0;if(((c[l>>2]|0)+1|0)>=120){Ef(p,q,o,r);break}else{Cf(p,q,o,r);break}}else{Ze((c[f>>2]|0)+(c[l>>2]<<1<<2)|0,c[o>>2]|0,(c[l>>2]|0)+1|0)}}while(0);c[(c[f>>2]|0)+(c[l>>2]<<2<<2)+4>>2]=c[n>>2];if((c[l>>2]|0)<50){Ze(c[f>>2]|0,c[m>>2]|0,c[l>>2]|0);r=c[f>>2]|0;b=c[h>>2]|0;d=c[l>>2]|0;d=d<<1;d=b+(d<<2)|0;d=d+4|0;b=c[h>>2]|0;a=c[l>>2]|0;s=c[g>>2]|0;e=c[g>>2]|0;e=s+e|0;s=c[j>>2]|0;Nf(r,d,b,a,e,0,s);i=k;return}n=c[f>>2]|0;p=c[m>>2]|0;o=c[l>>2]|0;m=(c[h>>2]|0)+((c[l>>2]|0)*5<<2)+20|0;if((c[l>>2]|0)>=120){Ef(n,p,o,m);r=c[f>>2]|0;b=c[h>>2]|0;d=c[l>>2]|0;d=d<<1;d=b+(d<<2)|0;d=d+4|0;b=c[h>>2]|0;a=c[l>>2]|0;s=c[g>>2]|0;e=c[g>>2]|0;e=s+e|0;s=c[j>>2]|0;Nf(r,d,b,a,e,0,s);i=k;return}else{Cf(n,p,o,m);r=c[f>>2]|0;b=c[h>>2]|0;d=c[l>>2]|0;d=d<<1;d=b+(d<<2)|0;d=d+4|0;b=c[h>>2]|0;a=c[l>>2]|0;s=c[g>>2]|0;e=c[g>>2]|0;e=s+e|0;s=c[j>>2]|0;Nf(r,d,b,a,e,0,s);i=k;return}}function Ff(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;j=i;i=i+32|0;f=j+24|0;l=j+20|0;n=j+16|0;g=j+12|0;k=j+8|0;h=j+4|0;m=j;c[f>>2]=a;c[l>>2]=b;c[n>>2]=d;c[g>>2]=e;c[k>>2]=(c[n>>2]|0)+3>>2;c[h>>2]=(c[n>>2]|0)-((c[k>>2]|0)*3|0);Hf(c[f>>2]|0,(c[f>>2]|0)+(c[k>>2]<<2<<2)+8|0,c[l>>2]|0,c[k>>2]|0,c[h>>2]|0,(c[g>>2]|0)+(c[k>>2]<<3<<2)+20|0)|0;a=c[g>>2]|0;e=c[f>>2]|0;b=(c[k>>2]|0)+1|0;d=(c[g>>2]|0)+(c[k>>2]<<3<<2)+20|0;if(((c[k>>2]|0)+1|0)>=120){Ef(a,e,b,d)}else{Cf(a,e,b,d)}a=(c[g>>2]|0)+(c[k>>2]<<1<<2)+4|0;e=(c[f>>2]|0)+(c[k>>2]<<2<<2)+8|0;b=(c[k>>2]|0)+1|0;d=(c[g>>2]|0)+(c[k>>2]<<3<<2)+20|0;if(((c[k>>2]|0)+1|0)>=120){Ef(a,e,b,d)}else{Cf(a,e,b,d)}c[m>>2]=xe(c[f>>2]|0,c[l>>2]|0,c[k>>2]|0,1)|0;b=qe(c[f>>2]|0,c[f>>2]|0,(c[l>>2]|0)+(c[k>>2]<<2)|0,c[k>>2]|0)|0;c[m>>2]=(c[m>>2]|0)+b;b=c[m>>2]<<1;c[m>>2]=b+(xe(c[f>>2]|0,c[f>>2]|0,c[k>>2]|0,1)|0);b=qe(c[f>>2]|0,c[f>>2]|0,(c[l>>2]|0)+(c[k>>2]<<1<<2)|0,c[k>>2]|0)|0;c[m>>2]=(c[m>>2]|0)+b;b=c[m>>2]<<1;c[m>>2]=b+(xe(c[f>>2]|0,c[f>>2]|0,c[k>>2]|0,1)|0);b=c[m>>2]|0;b=b+(oe(c[f>>2]|0,c[f>>2]|0,c[k>>2]|0,(c[l>>2]|0)+((c[k>>2]|0)*3<<2)|0,c[h>>2]|0)|0)|0;c[(c[f>>2]|0)+(c[k>>2]<<2)>>2]=b;b=(c[g>>2]|0)+(c[k>>2]<<2<<2)+8|0;d=c[f>>2]|0;m=(c[k>>2]|0)+1|0;e=(c[g>>2]|0)+(c[k>>2]<<3<<2)+20|0;if(((c[k>>2]|0)+1|0)>=120){Ef(b,d,m,e)}else{Cf(b,d,m,e)}Gf(c[f>>2]|0,(c[f>>2]|0)+(c[k>>2]<<2<<2)+8|0,c[l>>2]|0,c[k>>2]|0,c[h>>2]|0,(c[g>>2]|0)+(c[k>>2]<<3<<2)+20|0)|0;e=(c[f>>2]|0)+(c[k>>2]<<1<<2)|0;b=c[f>>2]|0;d=(c[k>>2]|0)+1|0;m=(c[g>>2]|0)+(c[k>>2]<<3<<2)+20|0;if(((c[k>>2]|0)+1|0)>=120){Ef(e,b,d,m)}else{Cf(e,b,d,m)}e=(c[g>>2]|0)+((c[k>>2]|0)*6<<2)+12|0;b=(c[f>>2]|0)+(c[k>>2]<<2<<2)+8|0;d=(c[k>>2]|0)+1|0;m=(c[g>>2]|0)+(c[k>>2]<<3<<2)+20|0;if(((c[k>>2]|0)+1|0)>=120){Ef(e,b,d,m)}else{Cf(e,b,d,m)}e=c[f>>2]|0;b=c[l>>2]|0;d=c[k>>2]|0;m=(c[g>>2]|0)+(c[k>>2]<<3<<2)+20|0;if((c[k>>2]|0)>=120){Ef(e,b,d,m)}else{Cf(e,b,d,m)}m=(c[f>>2]|0)+((c[k>>2]|0)*6<<2)|0;b=(c[l>>2]|0)+((c[k>>2]|0)*3<<2)|0;d=c[h>>2]|0;l=(c[g>>2]|0)+(c[k>>2]<<3<<2)+20|0;if((c[h>>2]|0)>=120){Ef(m,b,d,l);f=c[f>>2]|0;l=c[k>>2]|0;b=c[g>>2]|0;m=c[k>>2]|0;m=m<<1;m=b+(m<<2)|0;m=m+4|0;b=c[g>>2]|0;d=c[k>>2]|0;d=d*6|0;d=b+(d<<2)|0;d=d+12|0;b=c[g>>2]|0;a=c[g>>2]|0;e=c[k>>2]|0;e=e<<2;e=a+(e<<2)|0;e=e+8|0;a=c[h>>2]|0;a=a<<1;h=c[g>>2]|0;n=c[k>>2]|0;n=n<<3;n=h+(n<<2)|0;n=n+20|0;Pf(f,l,0,m,d,b,e,a,n);i=j;return}else{Cf(m,b,d,l);f=c[f>>2]|0;l=c[k>>2]|0;b=c[g>>2]|0;m=c[k>>2]|0;m=m<<1;m=b+(m<<2)|0;m=m+4|0;b=c[g>>2]|0;d=c[k>>2]|0;d=d*6|0;d=b+(d<<2)|0;d=d+12|0;b=c[g>>2]|0;a=c[g>>2]|0;e=c[k>>2]|0;e=e<<2;e=a+(e<<2)|0;e=e+8|0;a=c[h>>2]|0;a=a<<1;h=c[g>>2]|0;n=c[k>>2]|0;n=n<<3;n=h+(n<<2)|0;n=n+20|0;Pf(f,l,0,m,d,b,e,a,n);i=j;return}}function Gf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;l=i;i=i+32|0;h=l+24|0;n=l+20|0;p=l+16|0;j=l+12|0;o=l+8|0;m=l+4|0;k=l;c[h>>2]=a;c[n>>2]=b;c[p>>2]=d;c[j>>2]=e;c[o>>2]=f;c[m>>2]=g;a=qe(c[h>>2]|0,c[p>>2]|0,(c[p>>2]|0)+(c[j>>2]<<1<<2)|0,c[j>>2]|0)|0;c[(c[h>>2]|0)+(c[j>>2]<<2)>>2]=a;a=oe(c[m>>2]|0,(c[p>>2]|0)+(c[j>>2]<<2)|0,c[j>>2]|0,(c[p>>2]|0)+((c[j>>2]|0)*3<<2)|0,c[o>>2]|0)|0;c[(c[m>>2]|0)+(c[j>>2]<<2)>>2]=a;a=(ff(c[h>>2]|0,c[m>>2]|0,(c[j>>2]|0)+1|0)|0)<0;c[k>>2]=a?-1:0;n=c[n>>2]|0;if((c[k>>2]|0)!=0){te(n,c[m>>2]|0,c[h>>2]|0,(c[j>>2]|0)+1|0)|0;b=c[h>>2]|0;a=c[h>>2]|0;o=c[m>>2]|0;p=c[j>>2]|0;p=p+1|0;qe(b,a,o,p)|0;p=c[k>>2]|0;i=l;return p|0}else{te(n,c[h>>2]|0,c[m>>2]|0,(c[j>>2]|0)+1|0)|0;b=c[h>>2]|0;a=c[h>>2]|0;o=c[m>>2]|0;p=c[j>>2]|0;p=p+1|0;qe(b,a,o,p)|0;p=c[k>>2]|0;i=l;return p|0}return 0}function Hf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;l=i;i=i+32|0;h=l+28|0;n=l+24|0;p=l+20|0;j=l+16|0;o=l+12|0;m=l+8|0;q=l+4|0;k=l;c[h>>2]=a;c[n>>2]=b;c[p>>2]=d;c[j>>2]=e;c[o>>2]=f;c[m>>2]=g;c[q>>2]=xe(c[m>>2]|0,(c[p>>2]|0)+(c[j>>2]<<1<<2)|0,c[j>>2]|0,2)|0;g=c[q>>2]|0;g=g+(qe(c[h>>2]|0,c[m>>2]|0,c[p>>2]|0,c[j>>2]|0)|0)|0;c[(c[h>>2]|0)+(c[j>>2]<<2)>>2]=g;g=xe(c[m>>2]|0,(c[p>>2]|0)+((c[j>>2]|0)*3<<2)|0,c[o>>2]|0,2)|0;c[(c[m>>2]|0)+(c[o>>2]<<2)>>2]=g;g=c[m>>2]|0;f=(c[p>>2]|0)+(c[j>>2]<<2)|0;if((c[o>>2]|0)<(c[j>>2]|0)){q=oe(g,f,c[j>>2]|0,c[m>>2]|0,(c[o>>2]|0)+1|0)|0;c[(c[m>>2]|0)+(c[j>>2]<<2)>>2]=q}else{p=qe(g,f,c[m>>2]|0,c[j>>2]|0)|0;q=(c[m>>2]|0)+(c[j>>2]<<2)|0;c[q>>2]=(c[q>>2]|0)+p}xe(c[m>>2]|0,c[m>>2]|0,(c[j>>2]|0)+1|0,1)|0;q=(ff(c[h>>2]|0,c[m>>2]|0,(c[j>>2]|0)+1|0)|0)<0;c[k>>2]=q?-1:0;n=c[n>>2]|0;if((c[k>>2]|0)!=0){te(n,c[m>>2]|0,c[h>>2]|0,(c[j>>2]|0)+1|0)|0;b=c[h>>2]|0;a=c[h>>2]|0;p=c[m>>2]|0;q=c[j>>2]|0;q=q+1|0;qe(b,a,p,q)|0;q=c[k>>2]|0;i=l;return q|0}else{te(n,c[h>>2]|0,c[m>>2]|0,(c[j>>2]|0)+1|0)|0;b=c[h>>2]|0;a=c[h>>2]|0;p=c[m>>2]|0;q=c[j>>2]|0;q=q+1|0;qe(b,a,p,q)|0;q=c[k>>2]|0;i=l;return q|0}return 0}function If(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;m=i;i=i+48|0;j=m+32|0;p=m+28|0;r=m+24|0;q=m+20|0;k=m+16|0;o=m+12|0;n=m+8|0;s=m+4|0;l=m;c[j>>2]=a;c[p>>2]=b;c[r>>2]=d;c[q>>2]=e;c[k>>2]=f;c[o>>2]=g;c[n>>2]=h;a=qe(c[j>>2]|0,c[q>>2]|0,(c[q>>2]|0)+(c[k>>2]<<1<<2)|0,c[k>>2]|0)|0;c[(c[j>>2]|0)+(c[k>>2]<<2)>>2]=a;c[s>>2]=4;while(1){if(!((c[s>>2]|0)>>>0<(c[r>>2]|0)>>>0)){break}a=(c[q>>2]|0)+((ea(c[s>>2]|0,c[k>>2]|0)|0)<<2)|0;oe(c[j>>2]|0,c[j>>2]|0,(c[k>>2]|0)+1|0,a,c[k>>2]|0)|0;c[s>>2]=(c[s>>2]|0)+2}a=qe(c[n>>2]|0,(c[q>>2]|0)+(c[k>>2]<<2)|0,(c[q>>2]|0)+((c[k>>2]|0)*3<<2)|0,c[k>>2]|0)|0;c[(c[n>>2]|0)+(c[k>>2]<<2)>>2]=a;c[s>>2]=5;while(1){if(!((c[s>>2]|0)>>>0<(c[r>>2]|0)>>>0)){break}a=(c[q>>2]|0)+((ea(c[s>>2]|0,c[k>>2]|0)|0)<<2)|0;oe(c[n>>2]|0,c[n>>2]|0,(c[k>>2]|0)+1|0,a,c[k>>2]|0)|0;c[s>>2]=(c[s>>2]|0)+2}if((c[r>>2]&1|0)!=0){a=(c[q>>2]|0)+((ea(c[r>>2]|0,c[k>>2]|0)|0)<<2)|0;oe(c[n>>2]|0,c[n>>2]|0,(c[k>>2]|0)+1|0,a,c[o>>2]|0)|0}else{a=(c[q>>2]|0)+((ea(c[r>>2]|0,c[k>>2]|0)|0)<<2)|0;oe(c[j>>2]|0,c[j>>2]|0,(c[k>>2]|0)+1|0,a,c[o>>2]|0)|0}a=(ff(c[j>>2]|0,c[n>>2]|0,(c[k>>2]|0)+1|0)|0)<0;c[l>>2]=a?-1:0;o=c[p>>2]|0;if((c[l>>2]|0)!=0){te(o,c[n>>2]|0,c[j>>2]|0,(c[k>>2]|0)+1|0)|0;e=c[j>>2]|0;d=c[j>>2]|0;b=c[n>>2]|0;a=c[k>>2]|0;a=a+1|0;qe(e,d,b,a)|0;a=c[l>>2]|0;i=m;return a|0}else{te(o,c[j>>2]|0,c[n>>2]|0,(c[k>>2]|0)+1|0)|0;e=c[j>>2]|0;d=c[j>>2]|0;b=c[n>>2]|0;a=c[k>>2]|0;a=a+1|0;qe(e,d,b,a)|0;a=c[l>>2]|0;i=m;return a|0}return 0}function Jf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;n=i;i=i+48|0;j=n+36|0;q=n+32|0;l=n+28|0;p=n+24|0;k=n+20|0;t=n+16|0;o=n+12|0;s=n+8|0;m=n+4|0;r=n;c[j>>2]=a;c[q>>2]=b;c[l>>2]=d;c[p>>2]=e;c[k>>2]=f;c[t>>2]=g;c[o>>2]=h;c[r>>2]=0;c[r>>2]=c[r>>2]<<2;a=(c[p>>2]|0)+((ea(c[l>>2]|0,c[k>>2]|0)|0)<<2)|0;a=xe(c[j>>2]|0,a,c[t>>2]|0,2)|0;c[r>>2]=(c[r>>2]|0)+a;a=(c[p>>2]|0)+((ea((c[l>>2]|0)-2|0,c[k>>2]|0)|0)<<2)|0;a=qe(c[j>>2]|0,c[j>>2]|0,a,c[t>>2]|0)|0;c[r>>2]=(c[r>>2]|0)+a;if((c[t>>2]|0)!=(c[k>>2]|0)){a=(c[p>>2]|0)+((ea((c[l>>2]|0)-2|0,c[k>>2]|0)|0)<<2)|0;c[r>>2]=pe((c[j>>2]|0)+(c[t>>2]<<2)|0,a+(c[t>>2]<<2)|0,(c[k>>2]|0)-(c[t>>2]|0)|0,c[r>>2]|0)|0}c[s>>2]=(c[l>>2]|0)-4;while(1){h=c[r>>2]|0;if((c[s>>2]|0)<0){break}c[r>>2]=h<<2;a=xe(c[j>>2]|0,c[j>>2]|0,c[k>>2]|0,2)|0;c[r>>2]=(c[r>>2]|0)+a;a=(c[p>>2]|0)+((ea(c[s>>2]|0,c[k>>2]|0)|0)<<2)|0;a=qe(c[j>>2]|0,c[j>>2]|0,a,c[k>>2]|0)|0;c[r>>2]=(c[r>>2]|0)+a;c[s>>2]=(c[s>>2]|0)-2}c[(c[j>>2]|0)+(c[k>>2]<<2)>>2]=h;c[l>>2]=(c[l>>2]|0)+ -1;c[r>>2]=0;c[r>>2]=c[r>>2]<<2;a=(c[p>>2]|0)+((ea(c[l>>2]|0,c[k>>2]|0)|0)<<2)|0;a=xe(c[o>>2]|0,a,c[k>>2]|0,2)|0;c[r>>2]=(c[r>>2]|0)+a;a=(c[p>>2]|0)+((ea((c[l>>2]|0)-2|0,c[k>>2]|0)|0)<<2)|0;a=qe(c[o>>2]|0,c[o>>2]|0,a,c[k>>2]|0)|0;c[r>>2]=(c[r>>2]|0)+a;c[s>>2]=(c[l>>2]|0)-4;while(1){h=c[r>>2]|0;if((c[s>>2]|0)<0){break}c[r>>2]=h<<2;a=xe(c[o>>2]|0,c[o>>2]|0,c[k>>2]|0,2)|0;c[r>>2]=(c[r>>2]|0)+a;a=(c[p>>2]|0)+((ea(c[s>>2]|0,c[k>>2]|0)|0)<<2)|0;a=qe(c[o>>2]|0,c[o>>2]|0,a,c[k>>2]|0)|0;c[r>>2]=(c[r>>2]|0)+a;c[s>>2]=(c[s>>2]|0)-2}c[(c[o>>2]|0)+(c[k>>2]<<2)>>2]=h;if((c[l>>2]&1|0)!=0){xe(c[o>>2]|0,c[o>>2]|0,(c[k>>2]|0)+1|0,1)|0}else{xe(c[j>>2]|0,c[j>>2]|0,(c[k>>2]|0)+1|0,1)|0}a=(ff(c[j>>2]|0,c[o>>2]|0,(c[k>>2]|0)+1|0)|0)<0;c[m>>2]=a?-1:0;p=c[q>>2]|0;if((c[m>>2]|0)!=0){te(p,c[o>>2]|0,c[j>>2]|0,(c[k>>2]|0)+1|0)|0;e=c[j>>2]|0;d=c[j>>2]|0;b=c[o>>2]|0;a=c[k>>2]|0;a=a+1|0;qe(e,d,b,a)|0;a=c[l>>2]|0;a=a&1;a=a-1|0;b=c[m>>2]|0;a=b^a;c[m>>2]=a;a=c[m>>2]|0;i=n;return a|0}else{te(p,c[j>>2]|0,c[o>>2]|0,(c[k>>2]|0)+1|0)|0;e=c[j>>2]|0;d=c[j>>2]|0;b=c[o>>2]|0;a=c[k>>2]|0;a=a+1|0;qe(e,d,b,a)|0;a=c[l>>2]|0;a=a&1;a=a-1|0;b=c[m>>2]|0;a=b^a;c[m>>2]=a;a=c[m>>2]|0;i=n;return a|0}return 0}



function Kf(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;n=i;i=i+48|0;o=n+36|0;p=n+32|0;r=n+28|0;t=n+24|0;l=n+20|0;q=n+16|0;s=n+12|0;k=n+8|0;u=n+4|0;m=n;c[o>>2]=a;c[p>>2]=b;c[r>>2]=d;c[t>>2]=e;c[l>>2]=f;c[q>>2]=g;c[s>>2]=h;c[k>>2]=j;b=xe(c[k>>2]|0,(c[t>>2]|0)+(c[l>>2]<<1<<2)|0,c[l>>2]|0,c[s>>2]<<1)|0;c[(c[o>>2]|0)+(c[l>>2]<<2)>>2]=b;b=qe(c[o>>2]|0,c[t>>2]|0,c[k>>2]|0,c[l>>2]|0)|0;a=(c[o>>2]|0)+(c[l>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)+b;c[u>>2]=4;while(1){h=c[k>>2]|0;j=c[t>>2]|0;if(!((c[u>>2]|0)>>>0<(c[r>>2]|0)>>>0)){break}a=j+((ea(c[u>>2]|0,c[l>>2]|0)|0)<<2)|0;a=xe(h,a,c[l>>2]|0,ea(c[u>>2]|0,c[s>>2]|0)|0)|0;b=(c[o>>2]|0)+(c[l>>2]<<2)|0;c[b>>2]=(c[b>>2]|0)+a;b=qe(c[o>>2]|0,c[o>>2]|0,c[k>>2]|0,c[l>>2]|0)|0;a=(c[o>>2]|0)+(c[l>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)+b;c[u>>2]=(c[u>>2]|0)+2}a=xe(h,j+(c[l>>2]<<2)|0,c[l>>2]|0,c[s>>2]|0)|0;c[(c[k>>2]|0)+(c[l>>2]<<2)>>2]=a;c[u>>2]=3;while(1){j=c[p>>2]|0;h=c[t>>2]|0;if(!((c[u>>2]|0)>>>0<(c[r>>2]|0)>>>0)){break}a=h+((ea(c[u>>2]|0,c[l>>2]|0)|0)<<2)|0;a=xe(j,a,c[l>>2]|0,ea(c[u>>2]|0,c[s>>2]|0)|0)|0;b=(c[k>>2]|0)+(c[l>>2]<<2)|0;c[b>>2]=(c[b>>2]|0)+a;b=qe(c[k>>2]|0,c[k>>2]|0,c[p>>2]|0,c[l>>2]|0)|0;a=(c[k>>2]|0)+(c[l>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)+b;c[u>>2]=(c[u>>2]|0)+2}a=h+((ea(c[r>>2]|0,c[l>>2]|0)|0)<<2)|0;a=xe(j,a,c[q>>2]|0,ea(c[r>>2]|0,c[s>>2]|0)|0)|0;c[(c[p>>2]|0)+(c[q>>2]<<2)>>2]=a;if((c[r>>2]&1|0)!=0){oe(c[k>>2]|0,c[k>>2]|0,(c[l>>2]|0)+1|0,c[p>>2]|0,(c[q>>2]|0)+1|0)|0}else{oe(c[o>>2]|0,c[o>>2]|0,(c[l>>2]|0)+1|0,c[p>>2]|0,(c[q>>2]|0)+1|0)|0}a=(ff(c[o>>2]|0,c[k>>2]|0,(c[l>>2]|0)+1|0)|0)<0;c[m>>2]=a?-1:0;p=c[p>>2]|0;if((c[m>>2]|0)!=0){te(p,c[k>>2]|0,c[o>>2]|0,(c[l>>2]|0)+1|0)|0;e=c[o>>2]|0;d=c[o>>2]|0;b=c[k>>2]|0;a=c[l>>2]|0;a=a+1|0;qe(e,d,b,a)|0;a=c[m>>2]|0;i=n;return a|0}else{te(p,c[o>>2]|0,c[k>>2]|0,(c[l>>2]|0)+1|0)|0;e=c[o>>2]|0;d=c[o>>2]|0;b=c[k>>2]|0;a=c[l>>2]|0;a=a+1|0;qe(e,d,b,a)|0;a=c[m>>2]|0;i=n;return a|0}return 0}function Lf(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;n=i;i=i+48|0;k=n+36|0;q=n+32|0;s=n+28|0;t=n+24|0;l=n+20|0;u=n+16|0;p=n+12|0;o=n+8|0;r=n+4|0;m=n;c[k>>2]=a;c[q>>2]=b;c[s>>2]=d;c[t>>2]=e;c[l>>2]=f;c[u>>2]=g;c[p>>2]=h;c[o>>2]=j;a=xe(c[k>>2]|0,c[t>>2]|0,c[l>>2]|0,ea(c[p>>2]|0,c[s>>2]|0)|0)|0;c[(c[k>>2]|0)+(c[l>>2]<<2)>>2]=a;a=xe(c[o>>2]|0,(c[t>>2]|0)+(c[l>>2]<<2)|0,c[l>>2]|0,ea(c[p>>2]|0,(c[s>>2]|0)-1|0)|0)|0;c[(c[o>>2]|0)+(c[l>>2]<<2)>>2]=a;if((c[s>>2]&1|0)!=0){b=(c[t>>2]|0)+((ea(c[l>>2]|0,c[s>>2]|0)|0)<<2)|0;oe(c[o>>2]|0,c[o>>2]|0,(c[l>>2]|0)+1|0,b,c[u>>2]|0)|0;b=(c[t>>2]|0)+((ea(c[l>>2]|0,(c[s>>2]|0)-1|0)|0)<<2)|0;b=Mf(c[k>>2]|0,b,c[l>>2]|0,c[p>>2]|0,c[q>>2]|0)|0;a=(c[k>>2]|0)+(c[l>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)+b}else{a=(c[t>>2]|0)+((ea(c[l>>2]|0,c[s>>2]|0)|0)<<2)|0;oe(c[k>>2]|0,c[k>>2]|0,(c[l>>2]|0)+1|0,a,c[u>>2]|0)|0}c[r>>2]=2;while(1){j=c[k>>2]|0;if(!((c[r>>2]|0)>>>0<((c[s>>2]|0)-1|0)>>>0)){break}a=(c[t>>2]|0)+((ea(c[l>>2]|0,c[r>>2]|0)|0)<<2)|0;b=ea(c[p>>2]|0,(c[s>>2]|0)-(c[r>>2]|0)|0)|0;b=Mf(j,a,c[l>>2]|0,b,c[q>>2]|0)|0;a=(c[k>>2]|0)+(c[l>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)+b;c[r>>2]=(c[r>>2]|0)+1;a=(c[t>>2]|0)+((ea(c[l>>2]|0,c[r>>2]|0)|0)<<2)|0;b=ea(c[p>>2]|0,(c[s>>2]|0)-(c[r>>2]|0)|0)|0;b=Mf(c[o>>2]|0,a,c[l>>2]|0,b,c[q>>2]|0)|0;a=(c[o>>2]|0)+(c[l>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)+b;c[r>>2]=(c[r>>2]|0)+1}a=(ff(j,c[o>>2]|0,(c[l>>2]|0)+1|0)|0)<0;c[m>>2]=a?-1:0;p=c[q>>2]|0;if((c[m>>2]|0)!=0){te(p,c[o>>2]|0,c[k>>2]|0,(c[l>>2]|0)+1|0)|0;e=c[k>>2]|0;d=c[k>>2]|0;b=c[o>>2]|0;a=c[l>>2]|0;a=a+1|0;qe(e,d,b,a)|0;a=c[m>>2]|0;i=n;return a|0}else{te(p,c[k>>2]|0,c[o>>2]|0,(c[l>>2]|0)+1|0)|0;e=c[k>>2]|0;d=c[k>>2]|0;b=c[o>>2]|0;a=c[l>>2]|0;a=a+1|0;qe(e,d,b,a)|0;a=c[m>>2]|0;i=n;return a|0}return 0}function Mf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+32|0;k=g+20|0;n=g+16|0;h=g+12|0;m=g+8|0;j=g+4|0;l=g;c[k>>2]=a;c[n>>2]=b;c[h>>2]=d;c[m>>2]=e;c[j>>2]=f;c[l>>2]=xe(c[j>>2]|0,c[n>>2]|0,c[h>>2]|0,c[m>>2]|0)|0;a=c[l>>2]|0;a=a+(qe(c[k>>2]|0,c[k>>2]|0,c[j>>2]|0,c[h>>2]|0)|0)|0;i=g;return a|0}function Nf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;C=i;i=i+112|0;H=C+104|0;k=C+100|0;D=C+96|0;r=C+92|0;t=C+88|0;K=C+84|0;m=C+80|0;l=C+76|0;n=C+72|0;I=C+68|0;j=C+64|0;v=C+60|0;B=C+56|0;s=C+52|0;w=C+48|0;J=C+44|0;F=C+40|0;E=C+36|0;G=C+32|0;u=C+28|0;q=C+24|0;p=C+20|0;o=C+16|0;y=C+12|0;x=C+8|0;A=C+4|0;z=C;c[H>>2]=a;c[k>>2]=b;c[D>>2]=d;c[r>>2]=e;c[t>>2]=f;c[K>>2]=g;c[m>>2]=h;c[I>>2]=(c[r>>2]|0)+(c[r>>2]|0);c[j>>2]=(c[I>>2]|0)+1;c[v>>2]=(c[H>>2]|0)+(c[r>>2]<<2);c[B>>2]=(c[v>>2]|0)+(c[r>>2]<<2);c[s>>2]=(c[B>>2]|0)+(c[r>>2]<<2);c[w>>2]=(c[s>>2]|0)+(c[r>>2]<<2);f=c[k>>2]|0;g=c[k>>2]|0;e=c[D>>2]|0;h=c[j>>2]|0;if((c[K>>2]|0)!=0){qe(f,g,e,h)|0}else{te(f,g,e,h)|0}ug(c[k>>2]|0,c[k>>2]|0,c[j>>2]|0,1431655765,0)|0;e=c[D>>2]|0;f=c[B>>2]|0;h=c[D>>2]|0;g=c[j>>2]|0;if((c[K>>2]|0)!=0){qe(e,f,h,g)|0;ye(c[D>>2]|0,c[D>>2]|0,c[j>>2]|0,1)|0}else{te(e,f,h,g)|0;ye(c[D>>2]|0,c[D>>2]|0,c[j>>2]|0,1)|0}b=te(c[B>>2]|0,c[B>>2]|0,c[H>>2]|0,c[I>>2]|0)|0;a=c[w>>2]|0;c[a>>2]=(c[a>>2]|0)-b;te(c[k>>2]|0,c[k>>2]|0,c[B>>2]|0,c[j>>2]|0)|0;ye(c[k>>2]|0,c[k>>2]|0,c[j>>2]|0,1)|0;te(c[B>>2]|0,c[B>>2]|0,c[D>>2]|0,c[j>>2]|0)|0;c[l>>2]=qe(c[v>>2]|0,c[v>>2]|0,c[D>>2]|0,c[j>>2]|0)|0;c[F>>2]=(c[s>>2]|0)+4;c[J>>2]=(c[c[F>>2]>>2]|0)+(c[l>>2]|0);c[c[F>>2]>>2]=c[J>>2];if((c[J>>2]|0)>>>0<(c[l>>2]|0)>>>0){do{b=(c[F>>2]|0)+4|0;c[F>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[n>>2]=c[c[w>>2]>>2];c[c[w>>2]>>2]=c[m>>2];c[l>>2]=xe(c[D>>2]|0,c[w>>2]|0,c[t>>2]|0,1)|0;a=te(c[k>>2]|0,c[k>>2]|0,c[D>>2]|0,c[t>>2]|0)|0;c[l>>2]=(c[l>>2]|0)+a;c[G>>2]=(c[k>>2]|0)+(c[t>>2]<<2);c[E>>2]=c[c[G>>2]>>2];c[c[G>>2]>>2]=(c[E>>2]|0)-(c[l>>2]|0);if((c[E>>2]|0)>>>0<(c[l>>2]|0)>>>0){do{b=(c[G>>2]|0)+4|0;c[G>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}F=c[w>>2]|0;E=c[w>>2]|0;D=(c[k>>2]|0)+(c[r>>2]<<2)|0;if((((c[t>>2]|0)>((c[r>>2]|0)+1|0)|0)!=0|0)!=0){c[l>>2]=qe(F,E,D,(c[r>>2]|0)+1|0)|0;c[q>>2]=(c[s>>2]|0)+(c[j>>2]<<2);c[u>>2]=(c[c[q>>2]>>2]|0)+(c[l>>2]|0);c[c[q>>2]>>2]=c[u>>2];if((c[u>>2]|0)>>>0<(c[l>>2]|0)>>>0){do{b=(c[q>>2]|0)+4|0;c[q>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}}else{qe(F,E,D,c[t>>2]|0)|0}c[l>>2]=te(c[B>>2]|0,c[B>>2]|0,c[w>>2]|0,c[t>>2]|0)|0;c[m>>2]=c[c[w>>2]>>2];c[c[w>>2]>>2]=c[n>>2];c[o>>2]=(c[B>>2]|0)+(c[t>>2]<<2);c[p>>2]=c[c[o>>2]>>2];c[c[o>>2]>>2]=(c[p>>2]|0)-(c[l>>2]|0);if((c[p>>2]|0)>>>0<(c[l>>2]|0)>>>0){do{b=(c[o>>2]|0)+4|0;c[o>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[l>>2]=te(c[v>>2]|0,c[v>>2]|0,c[k>>2]|0,c[r>>2]|0)|0;c[x>>2]=c[B>>2];c[y>>2]=c[c[x>>2]>>2];c[c[x>>2]>>2]=(c[y>>2]|0)-(c[l>>2]|0);if((c[y>>2]|0)>>>0<(c[l>>2]|0)>>>0){do{b=(c[x>>2]|0)+4|0;c[x>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[l>>2]=qe(c[s>>2]|0,c[s>>2]|0,c[k>>2]|0,c[r>>2]|0)|0;a=c[w>>2]|0;c[a>>2]=(c[a>>2]|0)+(c[l>>2]|0);c[z>>2]=c[w>>2];c[A>>2]=(c[c[z>>2]>>2]|0)+(c[m>>2]|0);c[c[z>>2]>>2]=c[A>>2];if(!((c[A>>2]|0)>>>0<(c[m>>2]|0)>>>0)){i=C;return}do{b=(c[z>>2]|0)+4|0;c[z>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0);i=C;return}function Of(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;p=i;i=i+128|0;v=p+120|0;q=p+116|0;C=p+112|0;I=p+108|0;L=p+104|0;D=p+100|0;r=p+96|0;l=p+92|0;n=p+88|0;m=p+84|0;o=p+80|0;N=p+76|0;K=p+72|0;J=p+68|0;F=p+64|0;E=p+60|0;O=p+56|0;M=p+52|0;G=p+48|0;s=p+44|0;j=p+40|0;u=p+36|0;t=p+32|0;w=p+28|0;k=p+24|0;y=p+20|0;x=p+16|0;B=p+12|0;z=p+8|0;A=p+4|0;H=p;c[v>>2]=a;c[q>>2]=b;c[C>>2]=d;c[I>>2]=e;c[L>>2]=f;c[D>>2]=g;c[r>>2]=h;e=c[L>>2]|0;f=c[D>>2]|0;g=c[L>>2]|0;h=(c[q>>2]<<1)+1|0;if((c[C>>2]&2|0)!=0){qe(e,f,g,h)|0}else{te(e,f,g,h)|0}ye(c[L>>2]|0,c[L>>2]|0,(c[q>>2]<<1)+1|0,2)|0;f=te(c[D>>2]|0,c[D>>2]|0,c[v>>2]|0,c[q>>2]<<1)|0;e=(c[D>>2]|0)+(c[q>>2]<<1<<2)|0;c[e>>2]=(c[e>>2]|0)-f;ye(c[D>>2]|0,c[D>>2]|0,(c[q>>2]<<1)+1|0,1)|0;te(c[D>>2]|0,c[D>>2]|0,c[L>>2]|0,(c[q>>2]<<1)+1|0)|0;ye(c[D>>2]|0,c[D>>2]|0,(c[q>>2]<<1)+1|0,1)|0;e=c[I>>2]|0;f=(c[v>>2]|0)+(c[q>>2]<<1<<2)|0;g=c[I>>2]|0;h=(c[q>>2]<<1)+1|0;if((c[C>>2]&1|0)!=0){qe(e,f,g,h)|0;ye(c[I>>2]|0,c[I>>2]|0,(c[q>>2]<<1)+1|0,1)|0}else{te(e,f,g,h)|0;ye(c[I>>2]|0,c[I>>2]|0,(c[q>>2]<<1)+1|0,1)|0}te(c[L>>2]|0,c[L>>2]|0,c[I>>2]|0,(c[q>>2]<<1)+1|0)|0;ug(c[L>>2]|0,c[L>>2]|0,(c[q>>2]<<1)+1|0,1431655765,0)|0;te((c[v>>2]|0)+(c[q>>2]<<1<<2)|0,(c[v>>2]|0)+(c[q>>2]<<1<<2)|0,c[I>>2]|0,(c[q>>2]<<1)+1|0)|0;b=te((c[v>>2]|0)+(c[q>>2]<<1<<2)|0,(c[v>>2]|0)+(c[q>>2]<<1<<2)|0,c[v>>2]|0,c[q>>2]<<1)|0;a=(c[v>>2]|0)+(c[q>>2]<<1<<2)+(c[q>>2]<<1<<2)|0;c[a>>2]=(c[a>>2]|0)-b;te(c[D>>2]|0,c[D>>2]|0,(c[v>>2]|0)+(c[q>>2]<<1<<2)|0,(c[q>>2]<<1)+1|0)|0;ug(c[D>>2]|0,c[D>>2]|0,(c[q>>2]<<1)+1|0,1431655765,0)|0;c[l>>2]=qe((c[v>>2]|0)+(c[q>>2]<<2)|0,(c[v>>2]|0)+(c[q>>2]<<2)|0,c[I>>2]|0,(c[q>>2]<<1)+1|0)|0;c[K>>2]=(c[v>>2]|0)+((c[q>>2]|0)*3<<2)+4;c[N>>2]=(c[c[K>>2]>>2]|0)+(c[l>>2]|0);c[c[K>>2]>>2]=c[N>>2];if((c[N>>2]|0)>>>0<(c[l>>2]|0)>>>0){do{b=(c[K>>2]|0)+4|0;c[K>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[l>>2]=xe(c[I>>2]|0,(c[v>>2]|0)+((c[q>>2]|0)*5<<2)|0,c[r>>2]|0,2)|0;a=te(c[L>>2]|0,c[L>>2]|0,c[I>>2]|0,c[r>>2]|0)|0;c[l>>2]=(c[l>>2]|0)+a;c[F>>2]=(c[L>>2]|0)+(c[r>>2]<<2);c[J>>2]=c[c[F>>2]>>2];c[c[F>>2]>>2]=(c[J>>2]|0)-(c[l>>2]|0);if((c[J>>2]|0)>>>0<(c[l>>2]|0)>>>0){do{b=(c[F>>2]|0)+4|0;c[F>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[l>>2]=te((c[v>>2]|0)+(c[q>>2]<<2)|0,(c[v>>2]|0)+(c[q>>2]<<2)|0,c[L>>2]|0,c[q>>2]|0)|0;c[O>>2]=(c[v>>2]|0)+(c[q>>2]<<1<<2);c[E>>2]=c[c[O>>2]>>2];c[c[O>>2]>>2]=(c[E>>2]|0)-(c[l>>2]|0);if((c[E>>2]|0)>>>0<(c[l>>2]|0)>>>0){do{b=(c[O>>2]|0)+4|0;c[O>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}a=c[(c[v>>2]|0)+(c[q>>2]<<1<<2)+(c[q>>2]<<1<<2)>>2]|0;c[n>>2]=a+(qe((c[v>>2]|0)+((c[q>>2]|0)*3<<2)|0,(c[v>>2]|0)+((c[q>>2]|0)*3<<2)|0,c[L>>2]|0,c[q>>2]|0)|0);a=c[(c[L>>2]|0)+(c[q>>2]<<1<<2)>>2]|0;c[l>>2]=a+(qe((c[v>>2]|0)+(c[q>>2]<<2<<2)|0,c[D>>2]|0,(c[L>>2]|0)+(c[q>>2]<<2)|0,c[q>>2]|0)|0);c[G>>2]=(c[D>>2]|0)+(c[q>>2]<<2);c[M>>2]=(c[c[G>>2]>>2]|0)+(c[l>>2]|0);c[c[G>>2]>>2]=c[M>>2];if((c[M>>2]|0)>>>0<(c[l>>2]|0)>>>0){do{b=(c[G>>2]|0)+4|0;c[G>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}if((((c[r>>2]|0)>(c[q>>2]|0)|0)!=0|0)!=0){a=c[(c[D>>2]|0)+(c[q>>2]<<1<<2)>>2]|0;c[m>>2]=a+(qe((c[v>>2]|0)+((c[q>>2]|0)*5<<2)|0,(c[v>>2]|0)+((c[q>>2]|0)*5<<2)|0,(c[D>>2]|0)+(c[q>>2]<<2)|0,c[q>>2]|0)|0)}else{c[m>>2]=qe((c[v>>2]|0)+((c[q>>2]|0)*5<<2)|0,(c[v>>2]|0)+((c[q>>2]|0)*5<<2)|0,(c[D>>2]|0)+(c[q>>2]<<2)|0,c[r>>2]|0)|0}c[l>>2]=te((c[v>>2]|0)+(c[q>>2]<<1<<2)|0,(c[v>>2]|0)+(c[q>>2]<<1<<2)|0,(c[v>>2]|0)+(c[q>>2]<<2<<2)|0,(c[q>>2]|0)+(c[r>>2]|0)|0)|0;c[o>>2]=(c[(c[v>>2]|0)+((c[q>>2]|0)*5<<2)+((c[r>>2]|0)-1<<2)>>2]|0)-1;c[(c[v>>2]|0)+((c[q>>2]|0)*5<<2)+((c[r>>2]|0)-1<<2)>>2]=1;if((((c[r>>2]|0)>(c[q>>2]|0)|0)!=0|0)==0){c[z>>2]=(c[v>>2]|0)+(c[q>>2]<<2<<2);c[B>>2]=(c[c[z>>2]>>2]|0)+(c[n>>2]|0);c[c[z>>2]>>2]=c[B>>2];if((c[B>>2]|0)>>>0<(c[n>>2]|0)>>>0){do{b=(c[z>>2]|0)+4|0;c[z>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[H>>2]=(c[v>>2]|0)+((c[q>>2]|0)*3<<2)+(c[r>>2]<<2);c[A>>2]=c[c[H>>2]>>2];c[c[H>>2]>>2]=(c[A>>2]|0)-((c[l>>2]|0)+(c[m>>2]|0));if(!((c[A>>2]|0)>>>0<((c[l>>2]|0)+(c[m>>2]|0)|0)>>>0)){b=c[o>>2]|0;a=c[r>>2]|0;a=a-1|0;e=c[v>>2]|0;d=c[q>>2]|0;d=d*5|0;d=e+(d<<2)|0;a=d+(a<<2)|0;d=c[a>>2]|0;b=d+b|0;c[a>>2]=b;i=p;return}do{b=(c[H>>2]|0)+4|0;c[H>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0);b=c[o>>2]|0;a=c[r>>2]|0;a=a-1|0;e=c[v>>2]|0;d=c[q>>2]|0;d=d*5|0;d=e+(d<<2)|0;a=d+(a<<2)|0;d=c[a>>2]|0;b=d+b|0;c[a>>2]=b;i=p;return}z=(c[v>>2]|0)+(c[q>>2]<<2<<2)|0;if((c[n>>2]|0)>>>0>(c[m>>2]|0)>>>0){c[j>>2]=z;c[s>>2]=(c[c[j>>2]>>2]|0)+((c[n>>2]|0)-(c[m>>2]|0));c[c[j>>2]>>2]=c[s>>2];if((c[s>>2]|0)>>>0<((c[n>>2]|0)-(c[m>>2]|0)|0)>>>0){do{b=(c[j>>2]|0)+4|0;c[j>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}}else{c[t>>2]=z;c[u>>2]=c[c[t>>2]>>2];c[c[t>>2]>>2]=(c[u>>2]|0)-((c[m>>2]|0)-(c[n>>2]|0));if((c[u>>2]|0)>>>0<((c[m>>2]|0)-(c[n>>2]|0)|0)>>>0){do{b=(c[t>>2]|0)+4|0;c[t>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}}c[k>>2]=(c[v>>2]|0)+((c[q>>2]|0)*3<<2)+(c[r>>2]<<2);c[w>>2]=c[c[k>>2]>>2];c[c[k>>2]>>2]=(c[w>>2]|0)-(c[l>>2]|0);if((c[w>>2]|0)>>>0<(c[l>>2]|0)>>>0){do{b=(c[k>>2]|0)+4|0;c[k>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[x>>2]=(c[v>>2]|0)+((c[q>>2]|0)*5<<2)+(c[q>>2]<<2);c[y>>2]=(c[c[x>>2]>>2]|0)+(c[m>>2]|0);c[c[x>>2]>>2]=c[y>>2];if(!((c[y>>2]|0)>>>0<(c[m>>2]|0)>>>0)){b=c[o>>2]|0;a=c[r>>2]|0;a=a-1|0;e=c[v>>2]|0;d=c[q>>2]|0;d=d*5|0;d=e+(d<<2)|0;a=d+(a<<2)|0;d=c[a>>2]|0;b=d+b|0;c[a>>2]=b;i=p;return}do{b=(c[x>>2]|0)+4|0;c[x>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0);b=c[o>>2]|0;a=c[r>>2]|0;a=a-1|0;e=c[v>>2]|0;d=c[q>>2]|0;d=d*5|0;d=e+(d<<2)|0;a=d+(a<<2)|0;d=c[a>>2]|0;b=d+b|0;c[a>>2]=b;i=p;return}function Pf(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;o=i;i=i+80|0;p=o+72|0;m=o+68|0;E=o+64|0;B=o+60|0;s=o+56|0;v=o+52|0;l=o+48|0;n=o+44|0;C=o+40|0;w=o+36|0;z=o+32|0;D=o+28|0;y=o+24|0;x=o+20|0;q=o+16|0;u=o+12|0;t=o+8|0;r=o+4|0;A=o;c[p>>2]=a;c[m>>2]=b;c[E>>2]=d;c[B>>2]=e;c[s>>2]=f;c[v>>2]=g;c[l>>2]=h;c[n>>2]=j;c[C>>2]=k;c[w>>2]=(c[m>>2]<<1)+1;qe(c[l>>2]|0,c[l>>2]|0,c[v>>2]|0,c[w>>2]|0)|0;k=c[B>>2]|0;if((c[E>>2]&1|0)!=0){qe(k,c[B>>2]|0,c[v>>2]|0,c[w>>2]|0)|0;ye(c[B>>2]|0,c[B>>2]|0,c[w>>2]|0,1)|0}else{te(k,c[v>>2]|0,c[B>>2]|0,c[w>>2]|0)|0;ye(c[B>>2]|0,c[B>>2]|0,c[w>>2]|0,1)|0}re(c[v>>2]|0,c[v>>2]|0,c[w>>2]|0,c[p>>2]|0,c[m>>2]<<1)|0;te(c[v>>2]|0,c[v>>2]|0,c[B>>2]|0,c[w>>2]|0)|0;ye(c[v>>2]|0,c[v>>2]|0,c[w>>2]|0,2)|0;k=xe(c[C>>2]|0,(c[p>>2]|0)+((c[m>>2]|0)*6<<2)|0,c[n>>2]|0,4)|0;c[(c[C>>2]|0)+(c[n>>2]<<2)>>2]=k;re(c[v>>2]|0,c[v>>2]|0,c[w>>2]|0,c[C>>2]|0,(c[n>>2]|0)+1|0)|0;k=c[s>>2]|0;if((c[E>>2]&2|0)!=0){qe(k,c[s>>2]|0,(c[p>>2]|0)+(c[m>>2]<<1<<2)|0,c[w>>2]|0)|0;ye(c[s>>2]|0,c[s>>2]|0,c[w>>2]|0,1)|0}else{te(k,(c[p>>2]|0)+(c[m>>2]<<1<<2)|0,c[s>>2]|0,c[w>>2]|0)|0;ye(c[s>>2]|0,c[s>>2]|0,c[w>>2]|0,1)|0}te((c[p>>2]|0)+(c[m>>2]<<1<<2)|0,(c[p>>2]|0)+(c[m>>2]<<1<<2)|0,c[s>>2]|0,c[w>>2]|0)|0;we(c[l>>2]|0,(c[p>>2]|0)+(c[m>>2]<<1<<2)|0,c[w>>2]|0,65)|0;re((c[p>>2]|0)+(c[m>>2]<<1<<2)|0,(c[p>>2]|0)+(c[m>>2]<<1<<2)|0,c[w>>2]|0,(c[p>>2]|0)+((c[m>>2]|0)*6<<2)|0,c[n>>2]|0)|0;re((c[p>>2]|0)+(c[m>>2]<<1<<2)|0,(c[p>>2]|0)+(c[m>>2]<<1<<2)|0,c[w>>2]|0,c[p>>2]|0,c[m>>2]<<1)|0;ve(c[l>>2]|0,(c[p>>2]|0)+(c[m>>2]<<1<<2)|0,c[w>>2]|0,45)|0;ye(c[l>>2]|0,c[l>>2]|0,c[w>>2]|0,1)|0;te(c[v>>2]|0,c[v>>2]|0,(c[p>>2]|0)+(c[m>>2]<<1<<2)|0,c[w>>2]|0)|0;ug(c[v>>2]|0,c[v>>2]|0,c[w>>2]|0,1431655765,0)|0;te((c[p>>2]|0)+(c[m>>2]<<1<<2)|0,(c[p>>2]|0)+(c[m>>2]<<1<<2)|0,c[v>>2]|0,c[w>>2]|0)|0;te(c[B>>2]|0,c[l>>2]|0,c[B>>2]|0,c[w>>2]|0)|0;xe(c[C>>2]|0,c[s>>2]|0,c[w>>2]|0,3)|0;te(c[l>>2]|0,c[l>>2]|0,c[C>>2]|0,c[w>>2]|0)|0;ze(c[l>>2]|0,c[l>>2]|0,c[w>>2]|0,9);te(c[s>>2]|0,c[s>>2]|0,c[l>>2]|0,c[w>>2]|0)|0;ug(c[B>>2]|0,c[B>>2]|0,c[w>>2]|0,286331153,0)|0;qe(c[B>>2]|0,c[B>>2]|0,c[l>>2]|0,c[w>>2]|0)|0;ye(c[B>>2]|0,c[B>>2]|0,c[w>>2]|0,1)|0;te(c[l>>2]|0,c[l>>2]|0,c[B>>2]|0,c[w>>2]|0)|0;c[z>>2]=qe((c[p>>2]|0)+(c[m>>2]<<2)|0,(c[p>>2]|0)+(c[m>>2]<<2)|0,c[B>>2]|0,c[w>>2]|0)|0;c[y>>2]=(c[p>>2]|0)+(c[m>>2]<<1<<2)+(c[m>>2]<<2)+4;c[D>>2]=(c[c[y>>2]>>2]|0)+(c[z>>2]|0);c[c[y>>2]>>2]=c[D>>2];if((c[D>>2]|0)>>>0<(c[z>>2]|0)>>>0){do{b=(c[y>>2]|0)+4|0;c[y>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[z>>2]=qe((c[p>>2]|0)+((c[m>>2]|0)*3<<2)|0,(c[p>>2]|0)+((c[m>>2]|0)*3<<2)|0,c[s>>2]|0,c[m>>2]|0)|0;c[q>>2]=(c[s>>2]|0)+(c[m>>2]<<2);c[x>>2]=(c[c[q>>2]>>2]|0)+((c[(c[p>>2]|0)+(c[m>>2]<<1<<2)+(c[m>>2]<<1<<2)>>2]|0)+(c[z>>2]|0));c[c[q>>2]>>2]=c[x>>2];if((c[x>>2]|0)>>>0<((c[(c[p>>2]|0)+(c[m>>2]<<1<<2)+(c[m>>2]<<1<<2)>>2]|0)+(c[z>>2]|0)|0)>>>0){do{b=(c[q>>2]|0)+4|0;c[q>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[z>>2]=qe((c[p>>2]|0)+(c[m>>2]<<2<<2)|0,(c[s>>2]|0)+(c[m>>2]<<2)|0,c[v>>2]|0,c[m>>2]|0)|0;c[t>>2]=(c[v>>2]|0)+(c[m>>2]<<2);c[u>>2]=(c[c[t>>2]>>2]|0)+((c[(c[s>>2]|0)+(c[m>>2]<<1<<2)>>2]|0)+(c[z>>2]|0));c[c[t>>2]>>2]=c[u>>2];if((c[u>>2]|0)>>>0<((c[(c[s>>2]|0)+(c[m>>2]<<1<<2)>>2]|0)+(c[z>>2]|0)|0)>>>0){do{b=(c[t>>2]|0)+4|0;c[t>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[z>>2]=qe((c[p>>2]|0)+((c[m>>2]|0)*5<<2)|0,(c[v>>2]|0)+(c[m>>2]<<2)|0,c[l>>2]|0,c[m>>2]|0)|0;c[A>>2]=(c[l>>2]|0)+(c[m>>2]<<2);c[r>>2]=(c[c[A>>2]>>2]|0)+((c[(c[v>>2]|0)+(c[m>>2]<<1<<2)>>2]|0)+(c[z>>2]|0));c[c[A>>2]>>2]=c[r>>2];if((c[r>>2]|0)>>>0<((c[(c[v>>2]|0)+(c[m>>2]<<1<<2)>>2]|0)+(c[z>>2]|0)|0)>>>0){do{b=(c[A>>2]|0)+4|0;c[A>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}q=(c[p>>2]|0)+((c[m>>2]|0)*6<<2)|0;p=(c[p>>2]|0)+((c[m>>2]|0)*6<<2)|0;if((c[n>>2]|0)>((c[m>>2]|0)+1|0)){oe(q,p,c[n>>2]|0,(c[l>>2]|0)+(c[m>>2]<<2)|0,(c[m>>2]|0)+1|0)|0;i=o;return}else{qe(q,p,(c[l>>2]|0)+(c[m>>2]<<2)|0,c[n>>2]|0)|0;i=o;return}}function Qf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0;o=i;i=i+160|0;m=o+144|0;k=o+140|0;t=o+136|0;A=o+132|0;r=o+128|0;I=o+124|0;n=o+120|0;s=o+116|0;C=o+112|0;Q=o+108|0;T=o+104|0;S=o+100|0;R=o+96|0;N=o+92|0;M=o+88|0;K=o+84|0;E=o+80|0;J=o+76|0;G=o+72|0;F=o+68|0;P=o+64|0;O=o+60|0;H=o+56|0;D=o+52|0;L=o+48|0;x=o+44|0;y=o+40|0;z=o+36|0;w=o+32|0;B=o+28|0;h=o+24|0;v=o+20|0;u=o+16|0;p=o+12|0;q=o+8|0;j=o+4|0;l=o;c[m>>2]=a;c[k>>2]=b;c[t>>2]=d;c[A>>2]=e;c[r>>2]=f;c[I>>2]=g;c[s>>2]=(c[m>>2]|0)+((c[k>>2]|0)*3<<2);c[C>>2]=(c[m>>2]|0)+((c[k>>2]|0)*7<<2);c[S>>2]=(c[t>>2]|0)+(c[k>>2]<<2);c[T>>2]=c[c[S>>2]>>2];c[c[S>>2]>>2]=(c[T>>2]|0)-((c[c[m>>2]>>2]|0)>>>4);if((c[T>>2]|0)>>>0<(c[c[m>>2]>>2]|0)>>>4>>>0){do{a=(c[S>>2]|0)+4|0;c[S>>2]=a;T=c[a>>2]|0;c[a>>2]=T+ -1}while((T|0)==0)}c[Q>>2]=Rf((c[t>>2]|0)+(c[k>>2]<<2)|0,(c[m>>2]|0)+4|0,(c[k>>2]<<1)-1|0,28,c[I>>2]|0)|0;c[N>>2]=(c[t>>2]|0)+(c[k>>2]<<2)+(c[k>>2]<<1<<2)+ -4;c[R>>2]=c[c[N>>2]>>2];c[c[N>>2]>>2]=(c[R>>2]|0)-(c[Q>>2]|0);if((c[R>>2]|0)>>>0<(c[Q>>2]|0)>>>0){do{a=(c[N>>2]|0)+4|0;c[N>>2]=a;T=c[a>>2]|0;c[a>>2]=T+ -1}while((T|0)==0)}c[n>>2]=Rf(c[t>>2]|0,c[C>>2]|0,c[r>>2]|0,12,c[I>>2]|0)|0;c[K>>2]=(c[t>>2]|0)+(c[r>>2]<<2);c[M>>2]=c[c[K>>2]>>2];c[c[K>>2]>>2]=(c[M>>2]|0)-(c[n>>2]|0);if((c[M>>2]|0)>>>0<(c[n>>2]|0)>>>0){do{a=(c[K>>2]|0)+4|0;c[K>>2]=a;T=c[a>>2]|0;c[a>>2]=T+ -1}while((T|0)==0)}c[G>>2]=(c[s>>2]|0)+(c[k>>2]<<2);c[J>>2]=c[c[G>>2]>>2];c[c[G>>2]>>2]=(c[J>>2]|0)-((c[c[m>>2]>>2]|0)>>>2);if((c[J>>2]|0)>>>0<(c[c[m>>2]>>2]|0)>>>2>>>0){do{a=(c[G>>2]|0)+4|0;c[G>>2]=a;T=c[a>>2]|0;c[a>>2]=T+ -1}while((T|0)==0)}c[E>>2]=Rf((c[s>>2]|0)+(c[k>>2]<<2)|0,(c[m>>2]|0)+4|0,(c[k>>2]<<1)-1|0,30,c[I>>2]|0)|0;c[P>>2]=(c[s>>2]|0)+(c[k>>2]<<2)+(c[k>>2]<<1<<2)+ -4;c[F>>2]=c[c[P>>2]>>2];c[c[P>>2]>>2]=(c[F>>2]|0)-(c[E>>2]|0);if((c[F>>2]|0)>>>0<(c[E>>2]|0)>>>0){do{a=(c[P>>2]|0)+4|0;c[P>>2]=a;T=c[a>>2]|0;c[a>>2]=T+ -1}while((T|0)==0)}c[n>>2]=Rf(c[s>>2]|0,c[C>>2]|0,c[r>>2]|0,6,c[I>>2]|0)|0;c[H>>2]=(c[s>>2]|0)+(c[r>>2]<<2);c[O>>2]=c[c[H>>2]>>2];c[c[H>>2]>>2]=(c[O>>2]|0)-(c[n>>2]|0);if((c[O>>2]|0)>>>0<(c[n>>2]|0)>>>0){do{a=(c[H>>2]|0)+4|0;c[H>>2]=a;T=c[a>>2]|0;c[a>>2]=T+ -1}while((T|0)==0)}a=te((c[A>>2]|0)+(c[k>>2]<<2)|0,(c[A>>2]|0)+(c[k>>2]<<2)|0,c[m>>2]|0,c[k>>2]<<1)|0;T=(c[A>>2]|0)+((c[k>>2]|0)*3<<2)|0;c[T>>2]=(c[T>>2]|0)-a;c[n>>2]=te(c[A>>2]|0,c[A>>2]|0,c[C>>2]|0,c[r>>2]|0)|0;c[L>>2]=(c[A>>2]|0)+(c[r>>2]<<2);c[D>>2]=c[c[L>>2]>>2];c[c[L>>2]>>2]=(c[D>>2]|0)-(c[n>>2]|0);if((c[D>>2]|0)>>>0<(c[n>>2]|0)>>>0){do{a=(c[L>>2]|0)+4|0;c[L>>2]=a;T=c[a>>2]|0;c[a>>2]=T+ -1}while((T|0)==0)}te(c[t>>2]|0,c[t>>2]|0,c[s>>2]|0,((c[k>>2]|0)*3|0)+1|0)|0;ye(c[t>>2]|0,c[t>>2]|0,((c[k>>2]|0)*3|0)+1|0,2)|0;te(c[s>>2]|0,c[s>>2]|0,c[A>>2]|0,((c[k>>2]|0)*3|0)+1|0)|0;te(c[t>>2]|0,c[t>>2]|0,c[s>>2]|0,((c[k>>2]|0)*3|0)+1|0)|0;ze(c[t>>2]|0,c[t>>2]|0,((c[k>>2]|0)*3|0)+1|0,45);ug(c[s>>2]|0,c[s>>2]|0,((c[k>>2]|0)*3|0)+1|0,1431655765,0)|0;Rf(c[s>>2]|0,c[t>>2]|0,((c[k>>2]|0)*3|0)+1|0,2,c[I>>2]|0)|0;c[n>>2]=qe((c[m>>2]|0)+(c[k>>2]<<2)|0,(c[m>>2]|0)+(c[k>>2]<<2)|0,c[A>>2]|0,c[k>>2]|0)|0;C=te((c[m>>2]|0)+(c[k>>2]<<2)|0,(c[m>>2]|0)+(c[k>>2]<<2)|0,c[s>>2]|0,c[k>>2]|0)|0;c[n>>2]=(c[n>>2]|0)-C;C=(c[A>>2]|0)+(c[k>>2]<<2)|0;if(0<=(c[n>>2]|0)){c[z>>2]=C;c[y>>2]=(c[c[z>>2]>>2]|0)+(c[n>>2]|0);c[c[z>>2]>>2]=c[y>>2];if((c[y>>2]|0)>>>0<(c[n>>2]|0)>>>0){do{a=(c[z>>2]|0)+4|0;c[z>>2]=a;T=(c[a>>2]|0)+1|0;c[a>>2]=T}while((T|0)==0)}}else{c[x>>2]=C;do{a=c[x>>2]|0;c[x>>2]=a+4;T=c[a>>2]|0;c[a>>2]=T+ -1}while((T|0)==0)}c[n>>2]=te((c[m>>2]|0)+(c[k>>2]<<1<<2)|0,(c[A>>2]|0)+(c[k>>2]<<2)|0,(c[s>>2]|0)+(c[k>>2]<<2)|0,c[k>>2]|0)|0;c[B>>2]=(c[A>>2]|0)+(c[k>>2]<<1<<2);c[w>>2]=c[c[B>>2]>>2];c[c[B>>2]>>2]=(c[w>>2]|0)-(c[n>>2]|0);if((c[w>>2]|0)>>>0<(c[n>>2]|0)>>>0){do{a=(c[B>>2]|0)+4|0;c[B>>2]=a;T=c[a>>2]|0;c[a>>2]=T+ -1}while((T|0)==0)}c[n>>2]=qe((c[m>>2]|0)+((c[k>>2]|0)*3<<2)|0,c[s>>2]|0,(c[A>>2]|0)+(c[k>>2]<<1<<2)|0,(c[k>>2]|0)+1|0)|0;T=qe((c[s>>2]|0)+(c[k>>2]<<1<<2)|0,(c[s>>2]|0)+(c[k>>2]<<1<<2)|0,c[t>>2]|0,c[k>>2]|0)|0;w=(c[s>>2]|0)+((c[k>>2]|0)*3<<2)|0;c[w>>2]=(c[w>>2]|0)+T;w=te((c[m>>2]|0)+((c[k>>2]|0)*3<<2)|0,(c[m>>2]|0)+((c[k>>2]|0)*3<<2)|0,(c[s>>2]|0)+(c[k>>2]<<1<<2)|0,(c[k>>2]|0)+1|0)|0;c[n>>2]=(c[n>>2]|0)-w;w=(c[s>>2]|0)+(c[k>>2]<<2)+4|0;if(((0>(c[n>>2]|0)|0)!=0|0)==0){c[u>>2]=w;c[v>>2]=(c[c[u>>2]>>2]|0)+(c[n>>2]|0);c[c[u>>2]>>2]=c[v>>2];if((c[v>>2]|0)>>>0<(c[n>>2]|0)>>>0){do{a=(c[u>>2]|0)+4|0;c[u>>2]=a;T=(c[a>>2]|0)+1|0;c[a>>2]=T}while((T|0)==0)}}else{c[h>>2]=w;do{a=c[h>>2]|0;c[h>>2]=a+4;T=c[a>>2]|0;c[a>>2]=T+ -1}while((T|0)==0)}te((c[m>>2]|0)+(c[k>>2]<<2<<2)|0,(c[s>>2]|0)+(c[k>>2]<<2)|0,(c[t>>2]|0)+(c[k>>2]<<2)|0,(c[k>>2]<<1)+1|0)|0;c[n>>2]=pe((c[m>>2]|0)+((c[k>>2]|0)*6<<2)|0,(c[t>>2]|0)+(c[k>>2]<<2)|0,c[k>>2]|0,c[(c[m>>2]|0)+((c[k>>2]|0)*6<<2)>>2]|0)|0;c[q>>2]=(c[t>>2]|0)+(c[k>>2]<<1<<2);c[p>>2]=(c[c[q>>2]>>2]|0)+(c[n>>2]|0);c[c[q>>2]>>2]=c[p>>2];if((c[p>>2]|0)>>>0<(c[n>>2]|0)>>>0){do{a=(c[q>>2]|0)+4|0;c[q>>2]=a;T=(c[a>>2]|0)+1|0;c[a>>2]=T}while((T|0)==0)}c[n>>2]=qe((c[m>>2]|0)+((c[k>>2]|0)*7<<2)|0,(c[m>>2]|0)+((c[k>>2]|0)*7<<2)|0,(c[t>>2]|0)+(c[k>>2]<<1<<2)|0,c[k>>2]|0)|0;if((((c[r>>2]|0)!=(c[k>>2]|0)|0)!=0|0)==0){i=o;return}c[l>>2]=(c[m>>2]|0)+(c[k>>2]<<3<<2);c[j>>2]=(c[c[l>>2]>>2]|0)+((c[n>>2]|0)+(c[(c[t>>2]|0)+((c[k>>2]|0)*3<<2)>>2]|0));c[c[l>>2]>>2]=c[j>>2];if(!((c[j>>2]|0)>>>0<((c[n>>2]|0)+(c[(c[t>>2]|0)+((c[k>>2]|0)*3<<2)>>2]|0)|0)>>>0)){i=o;return}do{a=(c[l>>2]|0)+4|0;c[l>>2]=a;T=(c[a>>2]|0)+1|0;c[a>>2]=T}while((T|0)==0);i=o;return}function Rf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+32|0;k=g+20|0;n=g+16|0;h=g+12|0;m=g+8|0;j=g+4|0;l=g;c[k>>2]=a;c[n>>2]=b;c[h>>2]=d;c[m>>2]=e;c[j>>2]=f;c[l>>2]=xe(c[j>>2]|0,c[n>>2]|0,c[h>>2]|0,c[m>>2]|0)|0;a=c[l>>2]|0;a=a+(te(c[k>>2]|0,c[k>>2]|0,c[j>>2]|0,c[h>>2]|0)|0)|0;i=g;return a|0}function Sf(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0;s=i;i=i+208|0;k=s+200|0;n=s+196|0;ea=s+192|0;Y=s+188|0;q=s+184|0;p=s+180|0;r=s+176|0;x=s+172|0;o=s+168|0;m=s+164|0;aa=s+160|0;ha=s+156|0;ga=s+152|0;fa=s+148|0;da=s+144|0;Z=s+140|0;ca=s+136|0;$=s+132|0;_=s+128|0;X=s+124|0;W=s+120|0;U=s+116|0;O=s+112|0;T=s+108|0;Q=s+104|0;w=s+100|0;K=s+96|0;E=s+92|0;J=s+88|0;G=s+84|0;F=s+80|0;A=s+76|0;y=s+72|0;B=s+68|0;z=s+64|0;V=s+60|0;P=s+56|0;N=s+52|0;ba=s+48|0;D=s+44|0;C=s+40|0;I=s+36|0;H=s+32|0;M=s+28|0;L=s+24|0;S=s+20|0;R=s+16|0;u=s+12|0;t=s+8|0;l=s+4|0;v=s;c[k>>2]=a;c[n>>2]=b;c[ea>>2]=d;c[Y>>2]=e;c[q>>2]=f;c[p>>2]=g;c[r>>2]=h;c[x>>2]=j;c[m>>2]=(c[q>>2]|0)*3;c[aa>>2]=(c[m>>2]|0)+1;if((c[r>>2]|0)!=0){c[o>>2]=te(c[ea>>2]|0,c[ea>>2]|0,(c[k>>2]|0)+((c[q>>2]|0)*11<<2)|0,c[p>>2]|0)|0;c[ga>>2]=(c[ea>>2]|0)+(c[p>>2]<<2);c[ha>>2]=c[c[ga>>2]>>2];c[c[ga>>2]>>2]=(c[ha>>2]|0)-(c[o>>2]|0);if((c[ha>>2]|0)>>>0<(c[o>>2]|0)>>>0){do{b=(c[ga>>2]|0)+4|0;c[ga>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[o>>2]=Tf((c[k>>2]|0)+((c[q>>2]|0)*7<<2)|0,(c[k>>2]|0)+((c[q>>2]|0)*11<<2)|0,c[p>>2]|0,10,c[x>>2]|0)|0;c[da>>2]=(c[k>>2]|0)+((c[q>>2]|0)*7<<2)+(c[p>>2]<<2);c[fa>>2]=c[c[da>>2]>>2];c[c[da>>2]>>2]=(c[fa>>2]|0)-(c[o>>2]|0);if((c[fa>>2]|0)>>>0<(c[o>>2]|0)>>>0){do{b=(c[da>>2]|0)+4|0;c[da>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[$>>2]=c[Y>>2];c[ca>>2]=c[c[$>>2]>>2];c[c[$>>2]>>2]=(c[ca>>2]|0)-((c[(c[k>>2]|0)+((c[q>>2]|0)*11<<2)>>2]|0)>>>2);if((c[ca>>2]|0)>>>0<(c[(c[k>>2]|0)+((c[q>>2]|0)*11<<2)>>2]|0)>>>2>>>0){do{b=(c[$>>2]|0)+4|0;c[$>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[Z>>2]=Tf(c[Y>>2]|0,(c[k>>2]|0)+((c[q>>2]|0)*11<<2)+4|0,(c[p>>2]|0)-1|0,30,c[x>>2]|0)|0;c[X>>2]=(c[Y>>2]|0)+(c[p>>2]<<2)+ -4;c[_>>2]=c[c[X>>2]>>2];c[c[X>>2]>>2]=(c[_>>2]|0)-(c[Z>>2]|0);if((c[_>>2]|0)>>>0<(c[Z>>2]|0)>>>0){do{b=(c[X>>2]|0)+4|0;c[X>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[o>>2]=Tf(c[n>>2]|0,(c[k>>2]|0)+((c[q>>2]|0)*11<<2)|0,c[p>>2]|0,20,c[x>>2]|0)|0;c[U>>2]=(c[n>>2]|0)+(c[p>>2]<<2);c[W>>2]=c[c[U>>2]>>2];c[c[U>>2]>>2]=(c[W>>2]|0)-(c[o>>2]|0);if((c[W>>2]|0)>>>0<(c[o>>2]|0)>>>0){do{b=(c[U>>2]|0)+4|0;c[U>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[Q>>2]=(c[k>>2]|0)+(c[m>>2]<<2);c[T>>2]=c[c[Q>>2]>>2];c[c[Q>>2]>>2]=(c[T>>2]|0)-((c[(c[k>>2]|0)+((c[q>>2]|0)*11<<2)>>2]|0)>>>4);if((c[T>>2]|0)>>>0<(c[(c[k>>2]|0)+((c[q>>2]|0)*11<<2)>>2]|0)>>>4>>>0){do{b=(c[Q>>2]|0)+4|0;c[Q>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[O>>2]=Tf((c[k>>2]|0)+(c[m>>2]<<2)|0,(c[k>>2]|0)+((c[q>>2]|0)*11<<2)+4|0,(c[p>>2]|0)-1|0,28,c[x>>2]|0)|0;c[K>>2]=(c[k>>2]|0)+(c[m>>2]<<2)+(c[p>>2]<<2)+ -4;c[w>>2]=c[c[K>>2]>>2];c[c[K>>2]>>2]=(c[w>>2]|0)-(c[O>>2]|0);if((c[w>>2]|0)>>>0<(c[O>>2]|0)>>>0){do{b=(c[K>>2]|0)+4|0;c[K>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}}b=Tf((c[k>>2]|0)+(c[m>>2]<<2)+(c[q>>2]<<2)|0,c[k>>2]|0,c[q>>2]<<1,20,c[x>>2]|0)|0;a=(c[k>>2]|0)+(c[m>>2]<<2)+(c[m>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)-b;c[G>>2]=(c[n>>2]|0)+(c[q>>2]<<2);c[J>>2]=c[c[G>>2]>>2];c[c[G>>2]>>2]=(c[J>>2]|0)-((c[c[k>>2]>>2]|0)>>>4);if((c[J>>2]|0)>>>0<(c[c[k>>2]>>2]|0)>>>4>>>0){do{b=(c[G>>2]|0)+4|0;c[G>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[E>>2]=Tf((c[n>>2]|0)+(c[q>>2]<<2)|0,(c[k>>2]|0)+4|0,(c[q>>2]<<1)-1|0,28,c[x>>2]|0)|0;c[A>>2]=(c[n>>2]|0)+(c[q>>2]<<2)+(c[q>>2]<<1<<2)+ -4;c[F>>2]=c[c[A>>2]>>2];c[c[A>>2]>>2]=(c[F>>2]|0)-(c[E>>2]|0);if((c[F>>2]|0)>>>0<(c[E>>2]|0)>>>0){do{b=(c[A>>2]|0)+4|0;c[A>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}qe(c[x>>2]|0,c[n>>2]|0,(c[k>>2]|0)+(c[m>>2]<<2)|0,c[aa>>2]|0)|0;te((c[k>>2]|0)+(c[m>>2]<<2)|0,(c[k>>2]|0)+(c[m>>2]<<2)|0,c[n>>2]|0,c[aa>>2]|0)|0;c[y>>2]=c[n>>2];c[n>>2]=c[x>>2];c[x>>2]=c[y>>2];b=Tf((c[Y>>2]|0)+(c[q>>2]<<2)|0,c[k>>2]|0,c[q>>2]<<1,10,c[x>>2]|0)|0;a=(c[Y>>2]|0)+(c[m>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)-b;c[V>>2]=(c[k>>2]|0)+((c[q>>2]|0)*7<<2)+(c[q>>2]<<2);c[z>>2]=c[c[V>>2]>>2];c[c[V>>2]>>2]=(c[z>>2]|0)-((c[c[k>>2]>>2]|0)>>>2);if((c[z>>2]|0)>>>0<(c[c[k>>2]>>2]|0)>>>2>>>0){do{b=(c[V>>2]|0)+4|0;c[V>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[B>>2]=Tf((c[k>>2]|0)+((c[q>>2]|0)*7<<2)+(c[q>>2]<<2)|0,(c[k>>2]|0)+4|0,(c[q>>2]<<1)-1|0,30,c[x>>2]|0)|0;c[N>>2]=(c[k>>2]|0)+((c[q>>2]|0)*7<<2)+(c[q>>2]<<2)+(c[q>>2]<<1<<2)+ -4;c[P>>2]=c[c[N>>2]>>2];c[c[N>>2]>>2]=(c[P>>2]|0)-(c[B>>2]|0);if((c[P>>2]|0)>>>0<(c[B>>2]|0)>>>0){do{b=(c[N>>2]|0)+4|0;c[N>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}te(c[x>>2]|0,c[Y>>2]|0,(c[k>>2]|0)+((c[q>>2]|0)*7<<2)|0,c[aa>>2]|0)|0;qe((c[k>>2]|0)+((c[q>>2]|0)*7<<2)|0,(c[k>>2]|0)+((c[q>>2]|0)*7<<2)|0,c[Y>>2]|0,c[aa>>2]|0)|0;c[ba>>2]=c[Y>>2];c[Y>>2]=c[x>>2];c[x>>2]=c[ba>>2];b=te((c[ea>>2]|0)+(c[q>>2]<<2)|0,(c[ea>>2]|0)+(c[q>>2]<<2)|0,c[k>>2]|0,c[q>>2]<<1)|0;a=(c[ea>>2]|0)+(c[m>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)-b;we((c[k>>2]|0)+(c[m>>2]<<2)|0,c[Y>>2]|0,c[aa>>2]|0,257)|0;ze((c[k>>2]|0)+(c[m>>2]<<2)|0,(c[k>>2]|0)+(c[m>>2]<<2)|0,c[aa>>2]|0,11340);if((c[(c[k>>2]|0)+(c[m>>2]<<2)+(c[m>>2]<<2)>>2]&-536870912|0)!=0){a=(c[k>>2]|0)+(c[m>>2]<<2)+(c[m>>2]<<2)|0;c[a>>2]=c[a>>2]|-1073741824}ve(c[Y>>2]|0,(c[k>>2]|0)+(c[m>>2]<<2)|0,c[aa>>2]|0,60)|0;ug(c[Y>>2]|0,c[Y>>2]|0,c[aa>>2]|0,16843009,0)|0;Tf((c[k>>2]|0)+((c[q>>2]|0)*7<<2)|0,c[ea>>2]|0,c[aa>>2]|0,5,c[x>>2]|0)|0;we(c[n>>2]|0,(c[k>>2]|0)+((c[q>>2]|0)*7<<2)|0,c[aa>>2]|0,100)|0;Tf(c[n>>2]|0,c[ea>>2]|0,c[aa>>2]|0,9,c[x>>2]|0)|0;ze(c[n>>2]|0,c[n>>2]|0,c[aa>>2]|0,42525);we((c[k>>2]|0)+((c[q>>2]|0)*7<<2)|0,c[n>>2]|0,c[aa>>2]|0,225)|0;ze((c[k>>2]|0)+((c[q>>2]|0)*7<<2)|0,(c[k>>2]|0)+((c[q>>2]|0)*7<<2)|0,c[aa>>2]|0,36);te(c[ea>>2]|0,c[ea>>2]|0,(c[k>>2]|0)+((c[q>>2]|0)*7<<2)|0,c[aa>>2]|0)|0;te((c[k>>2]|0)+(c[m>>2]<<2)|0,(c[k>>2]|0)+((c[q>>2]|0)*7<<2)|0,(c[k>>2]|0)+(c[m>>2]<<2)|0,c[aa>>2]|0)|0;ye((c[k>>2]|0)+(c[m>>2]<<2)|0,(c[k>>2]|0)+(c[m>>2]<<2)|0,c[aa>>2]|0,1)|0;te((c[k>>2]|0)+((c[q>>2]|0)*7<<2)|0,(c[k>>2]|0)+((c[q>>2]|0)*7<<2)|0,(c[k>>2]|0)+(c[m>>2]<<2)|0,c[aa>>2]|0)|0;qe(c[Y>>2]|0,c[Y>>2]|0,c[n>>2]|0,c[aa>>2]|0)|0;ye(c[Y>>2]|0,c[Y>>2]|0,c[aa>>2]|0,1)|0;te(c[ea>>2]|0,c[ea>>2]|0,c[n>>2]|0,c[aa>>2]|0)|0;te(c[n>>2]|0,c[n>>2]|0,c[Y>>2]|0,c[aa>>2]|0)|0;c[o>>2]=qe((c[k>>2]|0)+(c[q>>2]<<2)|0,(c[k>>2]|0)+(c[q>>2]<<2)|0,c[Y>>2]|0,c[q>>2]|0)|0;c[o>>2]=pe((c[k>>2]|0)+(c[q>>2]<<1<<2)|0,(c[Y>>2]|0)+(c[q>>2]<<2)|0,c[q>>2]|0,c[o>>2]|0)|0;c[C>>2]=(c[Y>>2]|0)+(c[q>>2]<<1<<2);c[D>>2]=(c[c[C>>2]>>2]|0)+(c[o>>2]|0);c[c[C>>2]>>2]=c[D>>2];if((c[D>>2]|0)>>>0<(c[o>>2]|0)>>>0){do{b=(c[C>>2]|0)+4|0;c[C>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}a=c[(c[Y>>2]|0)+(c[m>>2]<<2)>>2]|0;c[o>>2]=a+(qe((c[k>>2]|0)+(c[m>>2]<<2)|0,(c[k>>2]|0)+(c[m>>2]<<2)|0,(c[Y>>2]|0)+(c[q>>2]<<1<<2)|0,c[q>>2]|0)|0);c[H>>2]=(c[k>>2]|0)+(c[m>>2]<<2)+(c[q>>2]<<2);c[I>>2]=(c[c[H>>2]>>2]|0)+(c[o>>2]|0);c[c[H>>2]>>2]=c[I>>2];if((c[I>>2]|0)>>>0<(c[o>>2]|0)>>>0){do{b=(c[H>>2]|0)+4|0;c[H>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}b=qe((c[k>>2]|0)+((c[q>>2]|0)*5<<2)|0,(c[k>>2]|0)+((c[q>>2]|0)*5<<2)|0,c[ea>>2]|0,c[q>>2]|0)|0;a=(c[k>>2]|0)+(c[m>>2]<<1<<2)|0;c[a>>2]=(c[a>>2]|0)+b;c[o>>2]=pe((c[k>>2]|0)+(c[m>>2]<<1<<2)|0,(c[ea>>2]|0)+(c[q>>2]<<2)|0,c[q>>2]|0,c[(c[k>>2]|0)+(c[m>>2]<<1<<2)>>2]|0)|0;c[L>>2]=(c[ea>>2]|0)+(c[q>>2]<<1<<2);c[M>>2]=(c[c[L>>2]>>2]|0)+(c[o>>2]|0);c[c[L>>2]>>2]=c[M>>2];if((c[M>>2]|0)>>>0<(c[o>>2]|0)>>>0){do{b=(c[L>>2]|0)+4|0;c[L>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}a=c[(c[ea>>2]|0)+(c[m>>2]<<2)>>2]|0;c[o>>2]=a+(qe((c[k>>2]|0)+((c[q>>2]|0)*7<<2)|0,(c[k>>2]|0)+((c[q>>2]|0)*7<<2)|0,(c[ea>>2]|0)+(c[q>>2]<<1<<2)|0,c[q>>2]|0)|0);c[R>>2]=(c[k>>2]|0)+(c[q>>2]<<3<<2);c[S>>2]=(c[c[R>>2]>>2]|0)+(c[o>>2]|0);c[c[R>>2]>>2]=c[S>>2];if((c[S>>2]|0)>>>0<(c[o>>2]|0)>>>0){do{b=(c[R>>2]|0)+4|0;c[R>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}w=qe((c[k>>2]|0)+((c[q>>2]|0)*9<<2)|0,(c[k>>2]|0)+((c[q>>2]|0)*9<<2)|0,c[n>>2]|0,c[q>>2]|0)|0;x=(c[k>>2]|0)+((c[q>>2]|0)*10<<2)|0;c[x>>2]=(c[x>>2]|0)+w;x=(c[k>>2]|0)+((c[q>>2]|0)*10<<2)|0;w=(c[n>>2]|0)+(c[q>>2]<<2)|0;if((c[r>>2]|0)==0){pe(x,w,c[p>>2]|0,c[(c[k>>2]|0)+((c[q>>2]|0)*10<<2)>>2]|0)|0;i=s;return}c[o>>2]=pe(x,w,c[q>>2]|0,c[(c[k>>2]|0)+((c[q>>2]|0)*10<<2)>>2]|0)|0;c[t>>2]=(c[n>>2]|0)+(c[q>>2]<<1<<2);c[u>>2]=(c[c[t>>2]>>2]|0)+(c[o>>2]|0);c[c[t>>2]>>2]=c[u>>2];if((c[u>>2]|0)>>>0<(c[o>>2]|0)>>>0){do{b=(c[t>>2]|0)+4|0;c[t>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}if((((c[p>>2]|0)>(c[q>>2]|0)|0)!=0|0)==0){qe((c[k>>2]|0)+((c[q>>2]|0)*11<<2)|0,(c[k>>2]|0)+((c[q>>2]|0)*11<<2)|0,(c[n>>2]|0)+(c[q>>2]<<1<<2)|0,c[p>>2]|0)|0;i=s;return}a=c[(c[n>>2]|0)+(c[m>>2]<<2)>>2]|0;c[o>>2]=a+(qe((c[k>>2]|0)+((c[q>>2]|0)*11<<2)|0,(c[k>>2]|0)+((c[q>>2]|0)*11<<2)|0,(c[n>>2]|0)+(c[q>>2]<<1<<2)|0,c[q>>2]|0)|0);c[v>>2]=(c[k>>2]|0)+(c[m>>2]<<2<<2);c[l>>2]=(c[c[v>>2]>>2]|0)+(c[o>>2]|0);c[c[v>>2]>>2]=c[l>>2];if(!((c[l>>2]|0)>>>0<(c[o>>2]|0)>>>0)){i=s;return}do{b=(c[v>>2]|0)+4|0;c[v>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0);i=s;return}function Tf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+32|0;k=g+20|0;n=g+16|0;h=g+12|0;m=g+8|0;j=g+4|0;l=g;c[k>>2]=a;c[n>>2]=b;c[h>>2]=d;c[m>>2]=e;c[j>>2]=f;c[l>>2]=xe(c[j>>2]|0,c[n>>2]|0,c[h>>2]|0,c[m>>2]|0)|0;a=c[l>>2]|0;a=a+(te(c[k>>2]|0,c[k>>2]|0,c[j>>2]|0,c[h>>2]|0)|0)|0;i=g;return a|0}function Uf(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0;t=i;i=i+256|0;r=t+252|0;q=t+248|0;na=t+244|0;D=t+240|0;ha=t+236|0;o=t+232|0;l=t+228|0;s=t+224|0;X=t+220|0;p=t+216|0;n=t+212|0;oa=t+208|0;va=t+204|0;ua=t+200|0;ta=t+196|0;qa=t+192|0;ka=t+188|0;pa=t+184|0;ma=t+180|0;la=t+176|0;ja=t+172|0;ia=t+168|0;ga=t+164|0;aa=t+160|0;fa=t+156|0;ca=t+152|0;ba=t+148|0;Z=t+144|0;T=t+140|0;Y=t+136|0;V=t+132|0;U=t+128|0;P=t+124|0;J=t+120|0;O=t+116|0;L=t+112|0;K=t+108|0;G=t+104|0;E=t+100|0;y=t+96|0;F=t+92|0;B=t+88|0;A=t+84|0;z=t+80|0;S=t+76|0;sa=t+72|0;ra=t+68|0;C=t+64|0;I=t+60|0;H=t+56|0;N=t+52|0;M=t+48|0;R=t+44|0;Q=t+40|0;x=t+36|0;W=t+32|0;$=t+28|0;_=t+24|0;ea=t+20|0;da=t+16|0;v=t+12|0;u=t+8|0;m=t+4|0;w=t;c[r>>2]=a;c[q>>2]=b;c[na>>2]=d;c[D>>2]=e;c[ha>>2]=f;c[o>>2]=g;c[l>>2]=h;c[s>>2]=j;c[X>>2]=k;c[n>>2]=(c[o>>2]|0)*3;c[oa>>2]=(c[n>>2]|0)+1;if((c[s>>2]|0)!=0){c[p>>2]=te((c[r>>2]|0)+((c[o>>2]|0)*7<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*7<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*15<<2)|0,c[l>>2]|0)|0;c[ua>>2]=(c[r>>2]|0)+((c[o>>2]|0)*7<<2)+(c[l>>2]<<2);c[va>>2]=c[c[ua>>2]>>2];c[c[ua>>2]>>2]=(c[va>>2]|0)-(c[p>>2]|0);if((c[va>>2]|0)>>>0<(c[p>>2]|0)>>>0){do{b=(c[ua>>2]|0)+4|0;c[ua>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[p>>2]=Vf(c[na>>2]|0,(c[r>>2]|0)+((c[o>>2]|0)*15<<2)|0,c[l>>2]|0,14,c[X>>2]|0)|0;c[qa>>2]=(c[na>>2]|0)+(c[l>>2]<<2);c[ta>>2]=c[c[qa>>2]>>2];c[c[qa>>2]>>2]=(c[ta>>2]|0)-(c[p>>2]|0);if((c[ta>>2]|0)>>>0<(c[p>>2]|0)>>>0){do{b=(c[qa>>2]|0)+4|0;c[qa>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[ma>>2]=(c[r>>2]|0)+(c[n>>2]<<2);c[pa>>2]=c[c[ma>>2]>>2];c[c[ma>>2]>>2]=(c[pa>>2]|0)-((c[(c[r>>2]|0)+((c[o>>2]|0)*15<<2)>>2]|0)>>>2);if((c[pa>>2]|0)>>>0<(c[(c[r>>2]|0)+((c[o>>2]|0)*15<<2)>>2]|0)>>>2>>>0){do{b=(c[ma>>2]|0)+4|0;c[ma>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[ka>>2]=Vf((c[r>>2]|0)+(c[n>>2]<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*15<<2)+4|0,(c[l>>2]|0)-1|0,30,c[X>>2]|0)|0;c[ja>>2]=(c[r>>2]|0)+(c[n>>2]<<2)+(c[l>>2]<<2)+ -4;c[la>>2]=c[c[ja>>2]>>2];c[c[ja>>2]>>2]=(c[la>>2]|0)-(c[ka>>2]|0);if((c[la>>2]|0)>>>0<(c[ka>>2]|0)>>>0){do{b=(c[ja>>2]|0)+4|0;c[ja>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[p>>2]=Vf((c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*15<<2)|0,c[l>>2]|0,28,c[X>>2]|0)|0;c[ga>>2]=(c[r>>2]|0)+((c[o>>2]|0)*11<<2)+(c[l>>2]<<2);c[ia>>2]=c[c[ga>>2]>>2];c[c[ga>>2]>>2]=(c[ia>>2]|0)-(c[p>>2]|0);if((c[ia>>2]|0)>>>0<(c[p>>2]|0)>>>0){do{b=(c[ga>>2]|0)+4|0;c[ga>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[ca>>2]=c[D>>2];c[fa>>2]=c[c[ca>>2]>>2];c[c[ca>>2]>>2]=(c[fa>>2]|0)-((c[(c[r>>2]|0)+((c[o>>2]|0)*15<<2)>>2]|0)>>>4);if((c[fa>>2]|0)>>>0<(c[(c[r>>2]|0)+((c[o>>2]|0)*15<<2)>>2]|0)>>>4>>>0){do{b=(c[ca>>2]|0)+4|0;c[ca>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[aa>>2]=Vf(c[D>>2]|0,(c[r>>2]|0)+((c[o>>2]|0)*15<<2)+4|0,(c[l>>2]|0)-1|0,28,c[X>>2]|0)|0;c[Z>>2]=(c[D>>2]|0)+(c[l>>2]<<2)+ -4;c[ba>>2]=c[c[Z>>2]>>2];c[c[Z>>2]>>2]=(c[ba>>2]|0)-(c[aa>>2]|0);if((c[ba>>2]|0)>>>0<(c[aa>>2]|0)>>>0){do{b=(c[Z>>2]|0)+4|0;c[Z>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[p>>2]=Vf((c[q>>2]|0)+4|0,(c[r>>2]|0)+((c[o>>2]|0)*15<<2)|0,c[l>>2]|0,10,c[X>>2]|0)|0;c[p>>2]=se((c[q>>2]|0)+(c[l>>2]<<2)+4|0,(c[q>>2]|0)+(c[l>>2]<<2)+4|0,(c[oa>>2]|0)-(c[l>>2]|0)-1|0,c[p>>2]|0)|0;c[p>>2]=c[(c[ha>>2]|0)+(c[oa>>2]<<2)>>2];c[(c[ha>>2]|0)+(c[oa>>2]<<2)>>2]=128;c[V>>2]=c[ha>>2];c[Y>>2]=c[c[V>>2]>>2];c[c[V>>2]>>2]=(c[Y>>2]|0)-((c[(c[r>>2]|0)+((c[o>>2]|0)*15<<2)>>2]|0)>>>6);if((c[Y>>2]|0)>>>0<(c[(c[r>>2]|0)+((c[o>>2]|0)*15<<2)>>2]|0)>>>6>>>0){do{b=(c[V>>2]|0)+4|0;c[V>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[T>>2]=Vf(c[ha>>2]|0,(c[r>>2]|0)+((c[o>>2]|0)*15<<2)+4|0,(c[l>>2]|0)-1|0,26,c[X>>2]|0)|0;c[P>>2]=(c[ha>>2]|0)+(c[l>>2]<<2)+ -4;c[U>>2]=c[c[P>>2]>>2];c[c[P>>2]>>2]=(c[U>>2]|0)-(c[T>>2]|0);if((c[U>>2]|0)>>>0<(c[T>>2]|0)>>>0){do{b=(c[P>>2]|0)+4|0;c[P>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[(c[ha>>2]|0)+(c[oa>>2]<<2)>>2]=c[p>>2]}b=Vf((c[D>>2]|0)+(c[o>>2]<<2)|0,c[r>>2]|0,c[o>>2]<<1,28,c[X>>2]|0)|0;a=(c[D>>2]|0)+(c[n>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)-b;c[L>>2]=(c[r>>2]|0)+((c[o>>2]|0)*11<<2)+(c[o>>2]<<2);c[O>>2]=c[c[L>>2]>>2];c[c[L>>2]>>2]=(c[O>>2]|0)-((c[c[r>>2]>>2]|0)>>>4);if((c[O>>2]|0)>>>0<(c[c[r>>2]>>2]|0)>>>4>>>0){do{b=(c[L>>2]|0)+4|0;c[L>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[J>>2]=Vf((c[r>>2]|0)+((c[o>>2]|0)*11<<2)+(c[o>>2]<<2)|0,(c[r>>2]|0)+4|0,(c[o>>2]<<1)-1|0,28,c[X>>2]|0)|0;c[G>>2]=(c[r>>2]|0)+((c[o>>2]|0)*11<<2)+(c[o>>2]<<2)+(c[o>>2]<<1<<2)+ -4;c[K>>2]=c[c[G>>2]>>2];c[c[G>>2]>>2]=(c[K>>2]|0)-(c[J>>2]|0);if((c[K>>2]|0)>>>0<(c[J>>2]|0)>>>0){do{b=(c[G>>2]|0)+4|0;c[G>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}te(c[X>>2]|0,c[D>>2]|0,(c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,c[oa>>2]|0)|0;qe((c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,c[D>>2]|0,c[oa>>2]|0)|0;c[E>>2]=c[D>>2];c[D>>2]=c[X>>2];c[X>>2]=c[E>>2];b=Vf((c[r>>2]|0)+(c[n>>2]<<2)+(c[o>>2]<<2)|0,c[r>>2]|0,c[o>>2]<<1,14,c[X>>2]|0)|0;a=(c[r>>2]|0)+(c[n>>2]<<2)+(c[n>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)-b;c[B>>2]=(c[na>>2]|0)+(c[o>>2]<<2);c[F>>2]=c[c[B>>2]>>2];c[c[B>>2]>>2]=(c[F>>2]|0)-((c[c[r>>2]>>2]|0)>>>2);if((c[F>>2]|0)>>>0<(c[c[r>>2]>>2]|0)>>>2>>>0){do{b=(c[B>>2]|0)+4|0;c[B>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[y>>2]=Vf((c[na>>2]|0)+(c[o>>2]<<2)|0,(c[r>>2]|0)+4|0,(c[o>>2]<<1)-1|0,30,c[X>>2]|0)|0;c[z>>2]=(c[na>>2]|0)+(c[o>>2]<<2)+(c[o>>2]<<1<<2)+ -4;c[A>>2]=c[c[z>>2]>>2];c[c[z>>2]>>2]=(c[A>>2]|0)-(c[y>>2]|0);if((c[A>>2]|0)>>>0<(c[y>>2]|0)>>>0){do{b=(c[z>>2]|0)+4|0;c[z>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}qe(c[X>>2]|0,c[na>>2]|0,(c[r>>2]|0)+(c[n>>2]<<2)|0,c[oa>>2]|0)|0;te((c[r>>2]|0)+(c[n>>2]<<2)|0,(c[r>>2]|0)+(c[n>>2]<<2)|0,c[na>>2]|0,c[oa>>2]|0)|0;c[S>>2]=c[na>>2];c[na>>2]=c[X>>2];c[X>>2]=c[S>>2];c[p>>2]=Vf((c[ha>>2]|0)+(c[o>>2]<<2)+4|0,c[r>>2]|0,c[o>>2]<<1,10,c[X>>2]|0)|0;c[ra>>2]=(c[q>>2]|0)+(c[o>>2]<<2);c[sa>>2]=c[c[ra>>2]>>2];c[c[ra>>2]>>2]=(c[sa>>2]|0)-((c[c[r>>2]>>2]|0)>>>6);if((c[sa>>2]|0)>>>0<(c[c[r>>2]>>2]|0)>>>6>>>0){do{b=(c[ra>>2]|0)+4|0;c[ra>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[p>>2]=Vf((c[q>>2]|0)+(c[o>>2]<<2)|0,(c[r>>2]|0)+4|0,(c[o>>2]<<1)-1|0,26,c[X>>2]|0)|0;c[p>>2]=se((c[q>>2]|0)+((c[o>>2]|0)*3<<2)+ -4|0,(c[q>>2]|0)+((c[o>>2]|0)*3<<2)+ -4|0,2,c[p>>2]|0)|0;te(c[X>>2]|0,c[ha>>2]|0,c[q>>2]|0,c[oa>>2]|0)|0;qe(c[q>>2]|0,c[q>>2]|0,c[ha>>2]|0,c[oa>>2]|0)|0;c[C>>2]=c[ha>>2];c[ha>>2]=c[X>>2];c[X>>2]=c[C>>2];b=te((c[r>>2]|0)+((c[o>>2]|0)*7<<2)+(c[o>>2]<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*7<<2)+(c[o>>2]<<2)|0,c[r>>2]|0,c[o>>2]<<1)|0;a=(c[r>>2]|0)+((c[o>>2]|0)*7<<2)+(c[n>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)-b;we(c[D>>2]|0,(c[r>>2]|0)+(c[n>>2]<<2)|0,c[oa>>2]|0,1028)|0;we(c[ha>>2]|0,c[D>>2]|0,c[oa>>2]|0,1300)|0;we(c[ha>>2]|0,(c[r>>2]|0)+(c[n>>2]<<2)|0,c[oa>>2]|0,1052688)|0;ze(c[ha>>2]|0,c[ha>>2]|0,c[oa>>2]|0,188513325);ug(c[ha>>2]|0,c[ha>>2]|0,c[oa>>2]|0,16843009,0)|0;we(c[D>>2]|0,c[ha>>2]|0,c[oa>>2]|0,12567555)|0;ze(c[D>>2]|0,c[D>>2]|0,c[oa>>2]|0,181440);if((c[(c[D>>2]|0)+(c[n>>2]<<2)>>2]&-33554432|0)!=0){a=(c[D>>2]|0)+(c[n>>2]<<2)|0;c[a>>2]=c[a>>2]|-67108864}we((c[r>>2]|0)+(c[n>>2]<<2)|0,c[ha>>2]|0,c[oa>>2]|0,4095)|0;ve((c[r>>2]|0)+(c[n>>2]<<2)|0,c[D>>2]|0,c[oa>>2]|0,240)|0;ze((c[r>>2]|0)+(c[n>>2]<<2)|0,(c[r>>2]|0)+(c[n>>2]<<2)|0,c[oa>>2]|0,1020);if((c[(c[r>>2]|0)+(c[n>>2]<<2)+(c[n>>2]<<2)>>2]&-536870912|0)!=0){a=(c[r>>2]|0)+(c[n>>2]<<2)+(c[n>>2]<<2)|0;c[a>>2]=c[a>>2]|-1073741824}Vf(c[na>>2]|0,(c[r>>2]|0)+((c[o>>2]|0)*7<<2)|0,c[oa>>2]|0,7,c[X>>2]|0)|0;Vf((c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*7<<2)|0,c[oa>>2]|0,13,c[X>>2]|0)|0;we((c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,c[na>>2]|0,c[oa>>2]|0,400)|0;Vf(c[q>>2]|0,(c[r>>2]|0)+((c[o>>2]|0)*7<<2)|0,c[oa>>2]|0,19,c[X>>2]|0)|0;we(c[q>>2]|0,(c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,c[oa>>2]|0,1428)|0;we(c[q>>2]|0,c[na>>2]|0,c[oa>>2]|0,112896)|0;ze(c[q>>2]|0,c[q>>2]|0,c[oa>>2]|0,182712915);ug(c[q>>2]|0,c[q>>2]|0,c[oa>>2]|0,16843009,0)|0;we((c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,c[q>>2]|0,c[oa>>2]|0,15181425)|0;ze((c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,c[oa>>2]|0,680400);we(c[na>>2]|0,c[q>>2]|0,c[oa>>2]|0,3969)|0;we(c[na>>2]|0,(c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,c[oa>>2]|0,900)|0;ze(c[na>>2]|0,c[na>>2]|0,c[oa>>2]|0,144);te((c[r>>2]|0)+((c[o>>2]|0)*7<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*7<<2)|0,c[q>>2]|0,c[oa>>2]|0)|0;te((c[r>>2]|0)+((c[o>>2]|0)*7<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*7<<2)|0,c[na>>2]|0,c[oa>>2]|0)|0;te((c[r>>2]|0)+((c[o>>2]|0)*7<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*7<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,c[oa>>2]|0)|0;qe((c[r>>2]|0)+(c[n>>2]<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,(c[r>>2]|0)+(c[n>>2]<<2)|0,c[oa>>2]|0)|0;ye((c[r>>2]|0)+(c[n>>2]<<2)|0,(c[r>>2]|0)+(c[n>>2]<<2)|0,c[oa>>2]|0,1)|0;te((c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,(c[r>>2]|0)+(c[n>>2]<<2)|0,c[oa>>2]|0)|0;te(c[D>>2]|0,c[na>>2]|0,c[D>>2]|0,c[oa>>2]|0)|0;ye(c[D>>2]|0,c[D>>2]|0,c[oa>>2]|0,1)|0;te(c[na>>2]|0,c[na>>2]|0,c[D>>2]|0,c[oa>>2]|0)|0;qe(c[ha>>2]|0,c[q>>2]|0,c[ha>>2]|0,c[oa>>2]|0)|0;ye(c[ha>>2]|0,c[ha>>2]|0,c[oa>>2]|0,1)|0;te(c[q>>2]|0,c[q>>2]|0,c[ha>>2]|0,c[oa>>2]|0)|0;c[p>>2]=qe((c[r>>2]|0)+(c[o>>2]<<2)|0,(c[r>>2]|0)+(c[o>>2]<<2)|0,c[ha>>2]|0,c[o>>2]|0)|0;c[p>>2]=pe((c[r>>2]|0)+(c[o>>2]<<1<<2)|0,(c[ha>>2]|0)+(c[o>>2]<<2)|0,c[o>>2]|0,c[p>>2]|0)|0;c[H>>2]=(c[ha>>2]|0)+(c[o>>2]<<1<<2);c[I>>2]=(c[c[H>>2]>>2]|0)+(c[p>>2]|0);c[c[H>>2]>>2]=c[I>>2];if((c[I>>2]|0)>>>0<(c[p>>2]|0)>>>0){do{b=(c[H>>2]|0)+4|0;c[H>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}a=c[(c[ha>>2]|0)+(c[n>>2]<<2)>>2]|0;c[p>>2]=a+(qe((c[r>>2]|0)+(c[n>>2]<<2)|0,(c[r>>2]|0)+(c[n>>2]<<2)|0,(c[ha>>2]|0)+(c[o>>2]<<1<<2)|0,c[o>>2]|0)|0);c[M>>2]=(c[r>>2]|0)+(c[o>>2]<<2<<2);c[N>>2]=(c[c[M>>2]>>2]|0)+(c[p>>2]|0);c[c[M>>2]>>2]=c[N>>2];if((c[N>>2]|0)>>>0<(c[p>>2]|0)>>>0){do{b=(c[M>>2]|0)+4|0;c[M>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}b=qe((c[r>>2]|0)+((c[o>>2]|0)*5<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*5<<2)|0,c[D>>2]|0,c[o>>2]|0)|0;a=(c[r>>2]|0)+(c[n>>2]<<1<<2)|0;c[a>>2]=(c[a>>2]|0)+b;c[p>>2]=pe((c[r>>2]|0)+(c[n>>2]<<1<<2)|0,(c[D>>2]|0)+(c[o>>2]<<2)|0,c[o>>2]|0,c[(c[r>>2]|0)+(c[n>>2]<<1<<2)>>2]|0)|0;c[Q>>2]=(c[D>>2]|0)+(c[o>>2]<<1<<2);c[R>>2]=(c[c[Q>>2]>>2]|0)+(c[p>>2]|0);c[c[Q>>2]>>2]=c[R>>2];if((c[R>>2]|0)>>>0<(c[p>>2]|0)>>>0){do{b=(c[Q>>2]|0)+4|0;c[Q>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}a=c[(c[D>>2]|0)+(c[n>>2]<<2)>>2]|0;c[p>>2]=a+(qe((c[r>>2]|0)+((c[o>>2]|0)*7<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*7<<2)|0,(c[D>>2]|0)+(c[o>>2]<<1<<2)|0,c[o>>2]|0)|0);c[W>>2]=(c[r>>2]|0)+(c[o>>2]<<3<<2);c[x>>2]=(c[c[W>>2]>>2]|0)+(c[p>>2]|0);c[c[W>>2]>>2]=c[x>>2];if((c[x>>2]|0)>>>0<(c[p>>2]|0)>>>0){do{b=(c[W>>2]|0)+4|0;c[W>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}b=qe((c[r>>2]|0)+((c[o>>2]|0)*9<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*9<<2)|0,c[na>>2]|0,c[o>>2]|0)|0;a=(c[r>>2]|0)+((c[o>>2]|0)*10<<2)|0;c[a>>2]=(c[a>>2]|0)+b;c[p>>2]=pe((c[r>>2]|0)+((c[o>>2]|0)*10<<2)|0,(c[na>>2]|0)+(c[o>>2]<<2)|0,c[o>>2]|0,c[(c[r>>2]|0)+((c[o>>2]|0)*10<<2)>>2]|0)|0;c[_>>2]=(c[na>>2]|0)+(c[o>>2]<<1<<2);c[$>>2]=(c[c[_>>2]>>2]|0)+(c[p>>2]|0);c[c[_>>2]>>2]=c[$>>2];if((c[$>>2]|0)>>>0<(c[p>>2]|0)>>>0){do{b=(c[_>>2]|0)+4|0;c[_>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}a=c[(c[na>>2]|0)+(c[n>>2]<<2)>>2]|0;c[p>>2]=a+(qe((c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*11<<2)|0,(c[na>>2]|0)+(c[o>>2]<<1<<2)|0,c[o>>2]|0)|0);c[da>>2]=(c[r>>2]|0)+((c[o>>2]|0)*12<<2);c[ea>>2]=(c[c[da>>2]>>2]|0)+(c[p>>2]|0);c[c[da>>2]>>2]=c[ea>>2];if((c[ea>>2]|0)>>>0<(c[p>>2]|0)>>>0){do{b=(c[da>>2]|0)+4|0;c[da>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}x=qe((c[r>>2]|0)+((c[o>>2]|0)*13<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*13<<2)|0,c[q>>2]|0,c[o>>2]|0)|0;y=(c[r>>2]|0)+((c[o>>2]|0)*14<<2)|0;c[y>>2]=(c[y>>2]|0)+x;y=(c[r>>2]|0)+((c[o>>2]|0)*14<<2)|0;x=(c[q>>2]|0)+(c[o>>2]<<2)|0;if((c[s>>2]|0)==0){pe(y,x,c[l>>2]|0,c[(c[r>>2]|0)+((c[o>>2]|0)*14<<2)>>2]|0)|0;i=t;return}c[p>>2]=pe(y,x,c[o>>2]|0,c[(c[r>>2]|0)+((c[o>>2]|0)*14<<2)>>2]|0)|0;c[u>>2]=(c[q>>2]|0)+(c[o>>2]<<1<<2);c[v>>2]=(c[c[u>>2]>>2]|0)+(c[p>>2]|0);c[c[u>>2]>>2]=c[v>>2];if((c[v>>2]|0)>>>0<(c[p>>2]|0)>>>0){do{b=(c[u>>2]|0)+4|0;c[u>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}if((((c[l>>2]|0)>(c[o>>2]|0)|0)!=0|0)==0){qe((c[r>>2]|0)+((c[o>>2]|0)*15<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*15<<2)|0,(c[q>>2]|0)+(c[o>>2]<<1<<2)|0,c[l>>2]|0)|0;i=t;return}a=c[(c[q>>2]|0)+(c[n>>2]<<2)>>2]|0;c[p>>2]=a+(qe((c[r>>2]|0)+((c[o>>2]|0)*15<<2)|0,(c[r>>2]|0)+((c[o>>2]|0)*15<<2)|0,(c[q>>2]|0)+(c[o>>2]<<1<<2)|0,c[o>>2]|0)|0);c[w>>2]=(c[r>>2]|0)+(c[o>>2]<<4<<2);c[m>>2]=(c[c[w>>2]>>2]|0)+(c[p>>2]|0);c[c[w>>2]>>2]=c[m>>2];if(!((c[m>>2]|0)>>>0<(c[p>>2]|0)>>>0)){i=t;return}do{b=(c[w>>2]|0)+4|0;c[w>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0);i=t;return}function Vf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+32|0;k=g+20|0;n=g+16|0;h=g+12|0;m=g+8|0;j=g+4|0;l=g;c[k>>2]=a;c[n>>2]=b;c[h>>2]=d;c[m>>2]=e;c[j>>2]=f;c[l>>2]=xe(c[j>>2]|0,c[n>>2]|0,c[h>>2]|0,c[m>>2]|0)|0;a=c[l>>2]|0;a=a+(te(c[k>>2]|0,c[k>>2]|0,c[j>>2]|0,c[h>>2]|0)|0)|0;i=g;return a|0}function Wf(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;J=i;i=i+208|0;m=J+204|0;q=J+200|0;k=J+196|0;h=J+192|0;n=J+188|0;j=J+184|0;l=J+180|0;C=J+176|0;v=J+80|0;y=J+76|0;H=J+72|0;s=J+68|0;u=J+64|0;I=J+60|0;G=J+56|0;F=J+52|0;D=J+48|0;B=J+44|0;E=J+40|0;A=J+36|0;z=J+32|0;x=J+28|0;w=J+24|0;g=J+20|0;f=J+16|0;t=J+12|0;r=J+8|0;p=J+4|0;o=J;c[m>>2]=a;c[q>>2]=b;c[k>>2]=d;c[h>>2]=e;c[y>>2]=v;c[l>>2]=c[k>>2];do{c[c[y>>2]>>2]=c[l>>2];c[l>>2]=(c[l>>2]>>1)+1;c[y>>2]=(c[y>>2]|0)+4}while((c[l>>2]|0)>=200);c[q>>2]=(c[q>>2]|0)+(c[k>>2]<<2);c[m>>2]=(c[m>>2]|0)+(c[k>>2]<<2);Xf((c[m>>2]|0)+(0-(c[l>>2]|0)<<2)|0,(c[q>>2]|0)+(0-(c[l>>2]|0)<<2)|0,c[l>>2]|0,c[h>>2]|0)|0;c[s>>2]=0;c[C>>2]=dg((c[k>>2]|0)+1|0)|0;a=(((Yf(c[C>>2]|0,c[k>>2]|0,(c[k>>2]>>1)+1|0)|0)<<2>>>0<65536|0)!=0|0)!=0;e=(Yf(c[C>>2]|0,c[k>>2]|0,(c[k>>2]>>1)+1|0)|0)<<2;if(a){a=i;i=i+((1*e|0)+15&-16)|0;e=a}else{e=Nd(s,e)|0}c[H>>2]=e;c[j>>2]=(c[h>>2]|0)+(c[k>>2]<<2)+12;while(1){a=(c[y>>2]|0)+ -4|0;c[y>>2]=a;c[k>>2]=c[a>>2];a=dg((c[k>>2]|0)+1|0)|0;c[C>>2]=a;e=c[j>>2]|0;if((a|0)>((c[k>>2]|0)+(c[l>>2]|0)|0)){De(e,(c[q>>2]|0)+(0-(c[k>>2]|0)<<2)|0,c[k>>2]|0,(c[m>>2]|0)+(0-(c[l>>2]|0)<<2)|0,c[l>>2]|0)|0;qe((c[j>>2]|0)+(c[l>>2]<<2)|0,(c[j>>2]|0)+(c[l>>2]<<2)|0,(c[q>>2]|0)+(0-(c[k>>2]|0)<<2)|0,(c[k>>2]|0)-(c[l>>2]|0)+1|0)|0;c[u>>2]=1}else{ag(e,c[C>>2]|0,(c[q>>2]|0)+(0-(c[k>>2]|0)<<2)|0,c[k>>2]|0,(c[m>>2]|0)+(0-(c[l>>2]|0)<<2)|0,c[l>>2]|0,c[H>>2]|0);a=1+(qe((c[j>>2]|0)+(c[l>>2]<<2)|0,(c[j>>2]|0)+(c[l>>2]<<2)|0,(c[q>>2]|0)+(0-(c[k>>2]|0)<<2)|0,(c[C>>2]|0)-(c[l>>2]|0)|0)|0)|0;c[(c[j>>2]|0)+(c[C>>2]<<2)>>2]=a;c[n>>2]=qe(c[j>>2]|0,c[j>>2]|0,(c[q>>2]|0)+(0-((c[k>>2]|0)-((c[C>>2]|0)-(c[l>>2]|0)))<<2)|0,(c[k>>2]|0)-((c[C>>2]|0)-(c[l>>2]|0))|0)|0;c[G>>2]=(c[j>>2]|0)+(c[k>>2]<<2)+(0-((c[C>>2]|0)-(c[l>>2]|0))<<2);c[I>>2]=(c[c[G>>2]>>2]|0)+(c[n>>2]|0);c[c[G>>2]>>2]=c[I>>2];if((c[I>>2]|0)>>>0<(c[n>>2]|0)>>>0){do{b=(c[G>>2]|0)+4|0;c[G>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[F>>2]=(c[j>>2]|0)+(c[l>>2]<<2)+(c[k>>2]<<2)+(0-(c[C>>2]|0)<<2);do{b=c[F>>2]|0;c[F>>2]=b+4;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0);e=c[j>>2]|0;if((c[(c[j>>2]|0)+(c[C>>2]<<2)>>2]|0)!=0){c[B>>2]=e;c[D>>2]=(c[c[B>>2]>>2]|0)+((c[(c[j>>2]|0)+(c[C>>2]<<2)>>2]|0)-1);c[c[B>>2]>>2]=c[D>>2];if((c[D>>2]|0)>>>0<((c[(c[j>>2]|0)+(c[C>>2]<<2)>>2]|0)-1|0)>>>0){do{b=(c[B>>2]|0)+4|0;c[B>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}}else{c[E>>2]=e;do{b=c[E>>2]|0;c[E>>2]=b+4;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}c[u>>2]=0}if(!((c[(c[j>>2]|0)+(c[k>>2]<<2)>>2]|0)>>>0<2)){c[x>>2]=c[j>>2];c[w>>2]=c[j>>2];c[g>>2]=(c[k>>2]|0)+1;do{b=c[w>>2]|0;c[w>>2]=b+4;b=~c[b>>2];a=c[x>>2]|0;c[x>>2]=a+4;c[a>>2]=b;a=(c[g>>2]|0)+ -1|0;c[g>>2]=a}while((a|0)!=0);c[t>>2]=c[j>>2];c[f>>2]=(c[c[t>>2]>>2]|0)+(c[u>>2]|0);c[c[t>>2]>>2]=c[f>>2];if((c[f>>2]|0)>>>0<(c[u>>2]|0)>>>0){do{b=(c[t>>2]|0)+4|0;c[t>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}if((c[(c[j>>2]|0)+(c[k>>2]<<2)>>2]|0)!=0){c[r>>2]=(c[m>>2]|0)+(0-(c[l>>2]|0)<<2);do{b=c[r>>2]|0;c[r>>2]=b+4;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0);te(c[j>>2]|0,c[j>>2]|0,(c[q>>2]|0)+(0-(c[k>>2]|0)<<2)|0,c[k>>2]|0)|0}}else{c[n>>2]=1;while(1){if((c[(c[j>>2]|0)+(c[k>>2]<<2)>>2]|0)==0?(ff(c[j>>2]|0,(c[q>>2]|0)+(0-(c[k>>2]|0)<<2)|0,c[k>>2]|0)|0)<=0:0){break}b=te(c[j>>2]|0,c[j>>2]|0,(c[q>>2]|0)+(0-(c[k>>2]|0)<<2)|0,c[k>>2]|0)|0;a=(c[j>>2]|0)+(c[k>>2]<<2)|0;c[a>>2]=(c[a>>2]|0)-b;c[n>>2]=(c[n>>2]|0)+1}c[z>>2]=(c[m>>2]|0)+(0-(c[l>>2]|0)<<2);c[A>>2]=c[c[z>>2]>>2];c[c[z>>2]>>2]=(c[A>>2]|0)-(c[n>>2]|0);if((c[A>>2]|0)>>>0<(c[n>>2]|0)>>>0){do{b=(c[z>>2]|0)+4|0;c[z>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0)}te(c[j>>2]|0,(c[q>>2]|0)+(0-(c[k>>2]|0)<<2)|0,c[j>>2]|0,c[k>>2]|0)|0}We(c[h>>2]|0,(c[j>>2]|0)+(c[k>>2]<<2)+(0-(c[l>>2]|0)<<2)|0,(c[m>>2]|0)+(0-(c[l>>2]|0)<<2)|0,c[l>>2]|0);c[n>>2]=qe((c[h>>2]|0)+(c[l>>2]<<2)|0,(c[h>>2]|0)+(c[l>>2]<<2)|0,(c[j>>2]|0)+(c[k>>2]<<2)+(0-(c[l>>2]|0)<<2)|0,(c[l>>2]<<1)-(c[k>>2]|0)|0)|0;c[n>>2]=Zf((c[m>>2]|0)+(0-(c[k>>2]|0)<<2)|0,(c[h>>2]|0)+((c[l>>2]|0)*3<<2)+(0-(c[k>>2]|0)<<2)|0,(c[j>>2]|0)+(c[l>>2]<<2)|0,(c[k>>2]|0)-(c[l>>2]|0)|0,c[n>>2]|0)|0;c[o>>2]=(c[m>>2]|0)+(0-(c[l>>2]|0)<<2);c[p>>2]=(c[c[o>>2]>>2]|0)+((c[n>>2]|0)+0);c[c[o>>2]>>2]=c[p>>2];if((c[p>>2]|0)>>>0<((c[n>>2]|0)+0|0)>>>0){do{b=(c[o>>2]|0)+4|0;c[o>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}if((c[y>>2]|0)==(v|0)){break}c[l>>2]=c[k>>2]}c[n>>2]=(c[(c[h>>2]|0)+(((c[l>>2]|0)*3|0)-(c[k>>2]|0)-1<<2)>>2]|0)>>>0>4294967288;if((((c[s>>2]|0)!=0|0)!=0|0)==0){a=c[n>>2]|0;i=J;return a|0}Od(c[s>>2]|0);a=c[n>>2]|0;i=J;return a|0}function Xf(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;g=i;i=i+176|0;D=g+168|0;m=g+164|0;o=g+160|0;u=g+156|0;X=g+152|0;s=g+148|0;n=g+144|0;q=g+140|0;r=g+136|0;k=g+132|0;l=g+128|0;p=g+124|0;h=g+120|0;j=g+116|0;W=g+112|0;U=g+108|0;T=g+104|0;V=g+100|0;w=g+96|0;v=g+92|0;t=g+88|0;A=g+84|0;C=g+80|0;K=g+76|0;P=g+72|0;R=g+68|0;S=g+64|0;N=g+60|0;O=g+56|0;Q=g+52|0;L=g+48|0;M=g+44|0;B=g+40|0;z=g+36|0;J=g+32|0;y=g+28|0;F=g+24|0;H=g+20|0;G=g+16|0;I=g+12|0;f=g+8|0;E=g+4|0;x=g;c[m>>2]=a;c[o>>2]=b;c[u>>2]=d;c[X>>2]=e;do{if((c[u>>2]|0)==1){c[q>>2]=(c[c[o>>2]>>2]|0)>>>16;c[r>>2]=c[c[o>>2]>>2]&65535;c[k>>2]=(~c[c[o>>2]>>2]>>>0)/((c[q>>2]|0)>>>0)|0;c[p>>2]=~c[c[o>>2]>>2]-(ea(c[k>>2]|0,c[q>>2]|0)|0);c[j>>2]=ea(c[k>>2]|0,c[r>>2]|0)|0;c[p>>2]=c[p>>2]<<16|65535;if(((c[p>>2]|0)>>>0<(c[j>>2]|0)>>>0?(c[k>>2]=(c[k>>2]|0)+ -1,c[p>>2]=(c[p>>2]|0)+(c[c[o>>2]>>2]|0),(c[p>>2]|0)>>>0>=(c[c[o>>2]>>2]|0)>>>0):0)?(c[p>>2]|0)>>>0<(c[j>>2]|0)>>>0:0){c[k>>2]=(c[k>>2]|0)+ -1;c[p>>2]=(c[p>>2]|0)+(c[c[o>>2]>>2]|0)}c[p>>2]=(c[p>>2]|0)-(c[j>>2]|0);c[l>>2]=((c[p>>2]|0)>>>0)/((c[q>>2]|0)>>>0)|0;c[h>>2]=(c[p>>2]|0)-(ea(c[l>>2]|0,c[q>>2]|0)|0);c[j>>2]=ea(c[l>>2]|0,c[r>>2]|0)|0;c[h>>2]=c[h>>2]<<16|65535;if(((c[h>>2]|0)>>>0<(c[j>>2]|0)>>>0?(c[l>>2]=(c[l>>2]|0)+ -1,c[h>>2]=(c[h>>2]|0)+(c[c[o>>2]>>2]|0),(c[h>>2]|0)>>>0>=(c[c[o>>2]>>2]|0)>>>0):0)?(c[h>>2]|0)>>>0<(c[j>>2]|0)>>>0:0){c[l>>2]=(c[l>>2]|0)+ -1;c[h>>2]=(c[h>>2]|0)+(c[c[o>>2]>>2]|0)}c[h>>2]=(c[h>>2]|0)-(c[j>>2]|0);c[c[m>>2]>>2]=c[k>>2]<<16|c[l>>2];c[n>>2]=c[h>>2]}else{c[s>>2]=(c[X>>2]|0)+(c[u>>2]<<2)+8;c[W>>2]=(c[u>>2]|0)-1;while(1){if((c[W>>2]|0)<0){break}c[(c[s>>2]|0)+(c[W>>2]<<2)>>2]=-1;c[W>>2]=(c[W>>2]|0)+ -1}c[U>>2]=(c[s>>2]|0)+(c[u>>2]<<2);c[T>>2]=c[o>>2];c[V>>2]=c[u>>2];do{b=c[T>>2]|0;c[T>>2]=b+4;b=~c[b>>2];a=c[U>>2]|0;c[U>>2]=a+4;c[a>>2]=b;a=(c[V>>2]|0)+ -1|0;c[V>>2]=a}while((a|0)!=0);if((c[u>>2]|0)==2){Be(c[m>>2]|0,0,c[s>>2]|0,4,c[o>>2]|0)|0;break}c[R>>2]=(c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2]|0)>>>16;c[S>>2]=c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2]&65535;c[N>>2]=(~c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2]>>>0)/((c[R>>2]|0)>>>0)|0;c[Q>>2]=~c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2]-(ea(c[N>>2]|0,c[R>>2]|0)|0);c[M>>2]=ea(c[N>>2]|0,c[S>>2]|0)|0;c[Q>>2]=c[Q>>2]<<16|65535;if(((c[Q>>2]|0)>>>0<(c[M>>2]|0)>>>0?(c[N>>2]=(c[N>>2]|0)+ -1,c[Q>>2]=(c[Q>>2]|0)+(c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2]|0),(c[Q>>2]|0)>>>0>=(c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2]|0)>>>0):0)?(c[Q>>2]|0)>>>0<(c[M>>2]|0)>>>0:0){c[N>>2]=(c[N>>2]|0)+ -1;c[Q>>2]=(c[Q>>2]|0)+(c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2]|0)}c[Q>>2]=(c[Q>>2]|0)-(c[M>>2]|0);c[O>>2]=((c[Q>>2]|0)>>>0)/((c[R>>2]|0)>>>0)|0;c[L>>2]=(c[Q>>2]|0)-(ea(c[O>>2]|0,c[R>>2]|0)|0);c[M>>2]=ea(c[O>>2]|0,c[S>>2]|0)|0;c[L>>2]=c[L>>2]<<16|65535;if(((c[L>>2]|0)>>>0<(c[M>>2]|0)>>>0?(c[O>>2]=(c[O>>2]|0)+ -1,c[L>>2]=(c[L>>2]|0)+(c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2]|0),(c[L>>2]|0)>>>0>=(c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2]|0)>>>0):0)?(c[L>>2]|0)>>>0<(c[M>>2]|0)>>>0:0){c[O>>2]=(c[O>>2]|0)+ -1;c[L>>2]=(c[L>>2]|0)+(c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2]|0)}c[L>>2]=(c[L>>2]|0)-(c[M>>2]|0);c[v>>2]=c[N>>2]<<16|c[O>>2];c[P>>2]=c[L>>2];c[t>>2]=ea(c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2]|0,c[v>>2]|0)|0;c[t>>2]=(c[t>>2]|0)+(c[(c[o>>2]|0)+((c[u>>2]|0)-2<<2)>>2]|0);if((c[t>>2]|0)>>>0<(c[(c[o>>2]|0)+((c[u>>2]|0)-2<<2)>>2]|0)>>>0){c[v>>2]=(c[v>>2]|0)+ -1;c[K>>2]=0-((c[t>>2]|0)>>>0>=(c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2]|0)>>>0);c[t>>2]=(c[t>>2]|0)-(c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2]|0);c[v>>2]=(c[v>>2]|0)+(c[K>>2]|0);c[t>>2]=(c[t>>2]|0)-(c[K>>2]&c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2])}c[f>>2]=c[(c[o>>2]|0)+((c[u>>2]|0)-2<<2)>>2];c[E>>2]=c[v>>2];c[F>>2]=c[f>>2]&65535;c[G>>2]=(c[f>>2]|0)>>>16;c[H>>2]=c[E>>2]&65535;c[I>>2]=(c[E>>2]|0)>>>16;c[B>>2]=ea(c[F>>2]|0,c[H>>2]|0)|0;c[z>>2]=ea(c[F>>2]|0,c[I>>2]|0)|0;c[J>>2]=ea(c[G>>2]|0,c[H>>2]|0)|0;c[y>>2]=ea(c[G>>2]|0,c[I>>2]|0)|0;c[z>>2]=(c[z>>2]|0)+((c[B>>2]|0)>>>16);c[z>>2]=(c[z>>2]|0)+(c[J>>2]|0);if((c[z>>2]|0)>>>0<(c[J>>2]|0)>>>0){c[y>>2]=(c[y>>2]|0)+65536}c[A>>2]=(c[y>>2]|0)+((c[z>>2]|0)>>>16);c[C>>2]=(c[z>>2]<<16)+(c[B>>2]&65535);c[t>>2]=(c[t>>2]|0)+(c[A>>2]|0);do{if((c[t>>2]|0)>>>0<(c[A>>2]|0)>>>0?(c[v>>2]=(c[v>>2]|0)+ -1,(((c[t>>2]|0)>>>0>=(c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2]|0)>>>0|0)!=0|0)!=0):0){if(!((c[t>>2]|0)>>>0>(c[(c[o>>2]|0)+((c[u>>2]|0)-1<<2)>>2]|0)>>>0)?!((c[C>>2]|0)>>>0>=(c[(c[o>>2]|0)+((c[u>>2]|0)-2<<2)>>2]|0)>>>0):0){break}c[v>>2]=(c[v>>2]|0)+ -1}}while(0);c[w>>2]=c[v>>2];kg(c[m>>2]|0,c[s>>2]|0,c[u>>2]<<1,c[o>>2]|0,c[u>>2]|0,c[w>>2]|0)|0;c[x>>2]=c[m>>2];do{b=c[x>>2]|0;c[x>>2]=b+4;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0);c[D>>2]=1;a=c[D>>2]|0;i=g;return a|0}}while(0);c[D>>2]=0;a=c[D>>2]|0;i=g;return a|0}function Yf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+32|0;g=e+16|0;k=e+12|0;j=e+8|0;h=e+4|0;f=e;c[g>>2]=a;c[k>>2]=b;c[j>>2]=d;c[h>>2]=c[g>>2]>>1;d=(c[g>>2]|0)+4|0;if((c[k>>2]|0)<=(c[h>>2]|0)){k=0;k=d+k|0;c[f>>2]=k;k=c[f>>2]|0;i=e;return k|0}k=(c[j>>2]|0)>(c[h>>2]|0)?c[g>>2]|0:c[h>>2]|0;k=d+k|0;c[f>>2]=k;k=c[f>>2]|0;i=e;return k|0}function Zf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+32|0;l=h+20|0;n=h+16|0;m=h+12|0;k=h+8|0;j=h+4|0;g=h;c[l>>2]=a;c[n>>2]=b;c[m>>2]=d;c[k>>2]=e;c[j>>2]=f;c[g>>2]=qe(c[l>>2]|0,c[n>>2]|0,c[m>>2]|0,c[k>>2]|0)|0;a=pe(c[l>>2]|0,c[l>>2]|0,c[k>>2]|0,c[j>>2]|0)|0;c[g>>2]=(c[g>>2]|0)+a;i=h;return c[g>>2]|0}function _f(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+32|0;m=f+20|0;l=f+16|0;h=f+12|0;k=f+8|0;j=f+4|0;g=f;c[m>>2]=a;c[l>>2]=b;c[h>>2]=d;c[k>>2]=e;c[g>>2]=0;if((c[k>>2]|0)==0){d=((c[h>>2]|0)*3|0)+2<<2;if(((((c[h>>2]|0)*3|0)+2<<2>>>0<65536|0)!=0|0)!=0){a=i;i=i+((1*d|0)+15&-16)|0;d=a}else{d=Nd(g,d)|0}c[k>>2]=d}m=c[m>>2]|0;d=c[l>>2]|0;l=c[h>>2]|0;k=c[k>>2]|0;if((c[h>>2]|0)>=200){c[j>>2]=Wf(m,d,l,k)|0}else{c[j>>2]=Xf(m,d,l,k)|0}if((((c[g>>2]|0)!=0|0)!=0|0)==0){a=c[j>>2]|0;i=f;return a|0}Od(c[g>>2]|0);a=c[j>>2]|0;i=f;return a|0}function $f(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+32|0;l=g+28|0;p=g+24|0;o=g+20|0;m=g+16|0;n=g+12|0;j=g+8|0;k=g+4|0;h=g;c[l>>2]=a;c[p>>2]=b;c[o>>2]=d;c[m>>2]=e;c[n>>2]=f;We(c[n>>2]|0,c[p>>2]|0,c[o>>2]|0,c[m>>2]|0);c[j>>2]=qe(c[l>>2]|0,c[n>>2]|0,(c[n>>2]|0)+(c[m>>2]<<2)|0,c[m>>2]|0)|0;c[h>>2]=c[l>>2];c[k>>2]=(c[c[h>>2]>>2]|0)+(c[j>>2]|0);c[c[h>>2]>>2]=c[k>>2];if(!((c[k>>2]|0)>>>0<(c[j>>2]|0)>>>0)){i=g;return}do{o=(c[h>>2]|0)+4|0;c[h>>2]=o;p=(c[o>>2]|0)+1|0;c[o>>2]=p}while((p|0)==0);i=g;return}function ag(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;x=i;i=i+160|0;o=x+148|0;l=x+144|0;R=x+140|0;p=x+136|0;m=x+132|0;q=x+128|0;B=x+124|0;T=x+120|0;V=x+116|0;U=x+112|0;t=x+108|0;y=x+104|0;z=x+100|0;I=x+96|0;D=x+92|0;J=x+88|0;L=x+84|0;M=x+80|0;Q=x+76|0;P=x+72|0;O=x+68|0;N=x+64|0;E=x+60|0;C=x+56|0;s=x+52|0;u=x+48|0;v=x+44|0;H=x+40|0;G=x+36|0;S=x+32|0;F=x+28|0;K=x+24|0;r=x+20|0;w=x+16|0;j=x+12|0;A=x+8|0;k=x+4|0;n=x;c[o>>2]=a;c[l>>2]=b;c[R>>2]=d;c[p>>2]=e;c[m>>2]=f;c[q>>2]=g;c[B>>2]=h;if(!((c[l>>2]&1|0)==0&(c[l>>2]|0)>=16)){if((((c[q>>2]|0)<(c[l>>2]|0)|0)!=0|0)==0){$f(c[o>>2]|0,c[R>>2]|0,c[m>>2]|0,c[l>>2]|0,c[B>>2]|0);i=x;return}if(((((c[p>>2]|0)+(c[q>>2]|0)|0)<=(c[l>>2]|0)|0)!=0|0)!=0){De(c[o>>2]|0,c[R>>2]|0,c[p>>2]|0,c[m>>2]|0,c[q>>2]|0)|0;i=x;return}De(c[B>>2]|0,c[R>>2]|0,c[p>>2]|0,c[m>>2]|0,c[q>>2]|0)|0;c[T>>2]=oe(c[o>>2]|0,c[B>>2]|0,c[l>>2]|0,(c[B>>2]|0)+(c[l>>2]<<2)|0,(c[p>>2]|0)+(c[q>>2]|0)-(c[l>>2]|0)|0)|0;c[U>>2]=c[o>>2];c[V>>2]=(c[c[U>>2]>>2]|0)+(c[T>>2]|0);c[c[U>>2]>>2]=c[V>>2];if(!((c[V>>2]|0)>>>0<(c[T>>2]|0)>>>0)){i=x;return}do{b=(c[U>>2]|0)+4|0;c[U>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0);i=x;return}c[t>>2]=c[l>>2]>>1;c[D>>2]=c[m>>2];c[L>>2]=c[q>>2];h=c[B>>2]|0;if((((c[p>>2]|0)>(c[t>>2]|0)|0)!=0|0)!=0){c[I>>2]=h;c[y>>2]=oe(c[B>>2]|0,c[R>>2]|0,c[t>>2]|0,(c[R>>2]|0)+(c[t>>2]<<2)|0,(c[p>>2]|0)-(c[t>>2]|0)|0)|0;c[P>>2]=c[B>>2];c[Q>>2]=(c[c[P>>2]>>2]|0)+(c[y>>2]|0);c[c[P>>2]>>2]=c[Q>>2];if((c[Q>>2]|0)>>>0<(c[y>>2]|0)>>>0){do{b=(c[P>>2]|0)+4|0;c[P>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[J>>2]=c[t>>2];c[M>>2]=(c[B>>2]|0)+(c[t>>2]<<2);if((((c[q>>2]|0)>(c[t>>2]|0)|0)!=0|0)!=0){c[D>>2]=c[M>>2];c[y>>2]=oe(c[M>>2]|0,c[m>>2]|0,c[t>>2]|0,(c[m>>2]|0)+(c[t>>2]<<2)|0,(c[q>>2]|0)-(c[t>>2]|0)|0)|0;c[N>>2]=c[M>>2];c[O>>2]=(c[c[N>>2]>>2]|0)+(c[y>>2]|0);c[c[N>>2]>>2]=c[O>>2];if((c[O>>2]|0)>>>0<(c[y>>2]|0)>>>0){do{b=(c[N>>2]|0)+4|0;c[N>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[L>>2]=c[t>>2];c[M>>2]=(c[M>>2]|0)+(c[t>>2]<<2)}}else{c[M>>2]=h;c[I>>2]=c[R>>2];c[J>>2]=c[p>>2]}ag(c[o>>2]|0,c[t>>2]|0,c[I>>2]|0,c[J>>2]|0,c[D>>2]|0,c[L>>2]|0,c[M>>2]|0);c[s>>2]=c[m>>2];c[v>>2]=c[q>>2];if((((c[p>>2]|0)>(c[t>>2]|0)|0)!=0|0)!=0){c[C>>2]=(c[B>>2]|0)+(c[t>>2]<<1<<2)+8;c[y>>2]=re((c[B>>2]|0)+(c[t>>2]<<1<<2)+8|0,c[R>>2]|0,c[t>>2]|0,(c[R>>2]|0)+(c[t>>2]<<2)|0,(c[p>>2]|0)-(c[t>>2]|0)|0)|0;c[(c[B>>2]|0)+(c[t>>2]<<1<<2)+8+(c[t>>2]<<2)>>2]=0;c[G>>2]=(c[B>>2]|0)+(c[t>>2]<<1<<2)+8;c[H>>2]=(c[c[G>>2]>>2]|0)+(c[y>>2]|0);c[c[G>>2]>>2]=c[H>>2];if((c[H>>2]|0)>>>0<(c[y>>2]|0)>>>0){do{b=(c[G>>2]|0)+4|0;c[G>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[u>>2]=(c[t>>2]|0)+(c[(c[C>>2]|0)+(c[t>>2]<<2)>>2]|0);if((((c[q>>2]|0)>(c[t>>2]|0)|0)!=0|0)!=0){c[s>>2]=(c[B>>2]|0)+(c[t>>2]<<1<<2)+8+(c[t>>2]<<2)+4;c[y>>2]=re((c[B>>2]|0)+(c[t>>2]<<1<<2)+8+(c[t>>2]<<2)+4|0,c[m>>2]|0,c[t>>2]|0,(c[m>>2]|0)+(c[t>>2]<<2)|0,(c[q>>2]|0)-(c[t>>2]|0)|0)|0;c[(c[B>>2]|0)+(c[t>>2]<<1<<2)+8+((c[t>>2]<<1)+1<<2)>>2]=0;c[F>>2]=(c[B>>2]|0)+(c[t>>2]<<1<<2)+8+(c[t>>2]<<2)+4;c[S>>2]=(c[c[F>>2]>>2]|0)+(c[y>>2]|0);c[c[F>>2]>>2]=c[S>>2];if((c[S>>2]|0)>>>0<(c[y>>2]|0)>>>0){do{b=(c[F>>2]|0)+4|0;c[F>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[v>>2]=(c[t>>2]|0)+(c[(c[s>>2]|0)+(c[t>>2]<<2)>>2]|0)}}else{c[C>>2]=c[R>>2];c[u>>2]=c[p>>2]}a:do{if((c[t>>2]|0)>=300){c[E>>2]=Ge(c[t>>2]|0,0)|0;c[K>>2]=(1<<c[E>>2])-1;while(1){if((c[t>>2]&c[K>>2]|0)==0){break a}c[E>>2]=(c[E>>2]|0)+ -1;c[K>>2]=c[K>>2]>>1}}else{c[E>>2]=0}}while(0);do{if((c[E>>2]|0)<4){D=c[B>>2]|0;C=c[C>>2]|0;if((((c[s>>2]|0)==(c[m>>2]|0)|0)!=0|0)==0){bg(D,C,c[s>>2]|0,c[t>>2]|0,c[B>>2]|0);break}De(D,C,c[u>>2]|0,c[s>>2]|0,c[v>>2]|0)|0;c[u>>2]=(c[u>>2]|0)+(c[v>>2]|0)-(c[t>>2]|0);c[u>>2]=(c[u>>2]|0)-((c[u>>2]|0)>(c[t>>2]|0));c[y>>2]=re(c[B>>2]|0,c[B>>2]|0,c[t>>2]|0,(c[B>>2]|0)+(c[t>>2]<<2)|0,c[u>>2]|0)|0;c[(c[B>>2]|0)+(c[t>>2]<<2)>>2]=0;c[w>>2]=c[B>>2];c[r>>2]=(c[c[w>>2]>>2]|0)+(c[y>>2]|0);c[c[w>>2]>>2]=c[r>>2];if((c[r>>2]|0)>>>0<(c[y>>2]|0)>>>0){do{b=(c[w>>2]|0)+4|0;c[w>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}}else{a=Ie(c[B>>2]|0,c[t>>2]|0,c[C>>2]|0,c[u>>2]|0,c[s>>2]|0,c[v>>2]|0,c[E>>2]|0)|0;c[(c[B>>2]|0)+(c[t>>2]<<2)>>2]=a}}while(0);a=c[(c[B>>2]|0)+(c[t>>2]<<2)>>2]|0;c[y>>2]=a+(qe(c[o>>2]|0,c[o>>2]|0,c[B>>2]|0,c[t>>2]|0)|0);c[y>>2]=(c[y>>2]|0)+(c[c[o>>2]>>2]&1);ye(c[o>>2]|0,c[o>>2]|0,c[t>>2]|0,1)|0;c[z>>2]=c[y>>2]<<31;c[y>>2]=(c[y>>2]|0)>>>1;a=(c[o>>2]|0)+((c[t>>2]|0)-1<<2)|0;c[a>>2]=c[a>>2]|c[z>>2];c[A>>2]=c[o>>2];c[j>>2]=(c[c[A>>2]>>2]|0)+(c[y>>2]|0);c[c[A>>2]>>2]=c[j>>2];if((c[j>>2]|0)>>>0<(c[y>>2]|0)>>>0){do{b=(c[A>>2]|0)+4|0;c[A>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}if(((((c[p>>2]|0)+(c[q>>2]|0)|0)<(c[l>>2]|0)|0)!=0|0)!=0){c[y>>2]=te((c[o>>2]|0)+(c[t>>2]<<2)|0,c[o>>2]|0,c[B>>2]|0,(c[p>>2]|0)+(c[q>>2]|0)-(c[t>>2]|0)|0)|0;a=c[(c[B>>2]|0)+(c[t>>2]<<2)>>2]|0;c[y>>2]=a+(cg((c[B>>2]|0)+(c[p>>2]<<2)+(c[q>>2]<<2)+(0-(c[t>>2]|0)<<2)|0,(c[o>>2]|0)+(c[p>>2]<<2)+(c[q>>2]<<2)+(0-(c[t>>2]|0)<<2)|0,(c[B>>2]|0)+(c[p>>2]<<2)+(c[q>>2]<<2)+(0-(c[t>>2]|0)<<2)|0,(c[l>>2]|0)-((c[p>>2]|0)+(c[q>>2]|0))|0,c[y>>2]|0)|0);c[y>>2]=se(c[o>>2]|0,c[o>>2]|0,(c[p>>2]|0)+(c[q>>2]|0)|0,c[y>>2]|0)|0;i=x;return}a=c[(c[B>>2]|0)+(c[t>>2]<<2)>>2]|0;c[y>>2]=a+(te((c[o>>2]|0)+(c[t>>2]<<2)|0,c[o>>2]|0,c[B>>2]|0,c[t>>2]|0)|0);c[n>>2]=c[o>>2];c[k>>2]=c[c[n>>2]>>2];c[c[n>>2]>>2]=(c[k>>2]|0)-(c[y>>2]|0);if(!((c[k>>2]|0)>>>0<(c[y>>2]|0)>>>0)){i=x;return}do{b=(c[n>>2]|0)+4|0;c[n>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0);i=x;return}function bg(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+32|0;l=g+28|0;p=g+24|0;o=g+20|0;m=g+16|0;n=g+12|0;j=g+8|0;k=g+4|0;h=g;c[l>>2]=a;c[p>>2]=b;c[o>>2]=d;c[m>>2]=e;c[n>>2]=f;We(c[n>>2]|0,c[p>>2]|0,c[o>>2]|0,(c[m>>2]|0)+1|0);a=c[(c[n>>2]|0)+(c[m>>2]<<1<<2)>>2]|0;c[j>>2]=a+(te(c[l>>2]|0,c[n>>2]|0,(c[n>>2]|0)+(c[m>>2]<<2)|0,c[m>>2]|0)|0);c[(c[l>>2]|0)+(c[m>>2]<<2)>>2]=0;c[h>>2]=c[l>>2];c[k>>2]=(c[c[h>>2]>>2]|0)+(c[j>>2]|0);c[c[h>>2]>>2]=c[k>>2];if(!((c[k>>2]|0)>>>0<(c[j>>2]|0)>>>0)){i=g;return}do{o=(c[h>>2]|0)+4|0;c[h>>2]=o;p=(c[o>>2]|0)+1|0;c[o>>2]=p}while((p|0)==0);i=g;return}function cg(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+32|0;l=h+20|0;n=h+16|0;m=h+12|0;k=h+8|0;j=h+4|0;g=h;c[l>>2]=a;c[n>>2]=b;c[m>>2]=d;c[k>>2]=e;c[j>>2]=f;c[g>>2]=te(c[l>>2]|0,c[n>>2]|0,c[m>>2]|0,c[k>>2]|0)|0;a=se(c[l>>2]|0,c[l>>2]|0,c[k>>2]|0,c[j>>2]|0)|0;c[g>>2]=(c[g>>2]|0)+a;i=h;return c[g>>2]|0}function dg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;d=i;i=i+16|0;b=d+8|0;f=d+4|0;e=d;c[f>>2]=a;g=c[f>>2]|0;do{if((c[f>>2]|0)>=16){a=c[f>>2]|0;if((g|0)<61){c[b>>2]=a+1&-2;break}g=c[f>>2]|0;if((a|0)<121){c[b>>2]=g+3&-4;break}c[e>>2]=g+1>>1;if((c[e>>2]|0)>=300){g=c[e>>2]|0;c[b>>2]=(He(g,Ge(c[e>>2]|0,0)|0)|0)<<1;break}else{c[b>>2]=(c[f>>2]|0)+7&-8;break}}else{c[b>>2]=g}}while(0);i=d;return c[b>>2]|0}function eg(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;v=i;i=i+112|0;l=v+108|0;j=v+104|0;k=v+100|0;m=v+96|0;u=v+92|0;H=v+88|0;J=v+84|0;I=v+80|0;n=v+76|0;o=v+72|0;p=v+68|0;B=v+64|0;C=v+60|0;D=v+56|0;F=v+52|0;E=v+48|0;G=v+44|0;s=v+40|0;t=v+36|0;A=v+32|0;z=v+28|0;y=v+24|0;h=v+20|0;g=v+16|0;r=v+12|0;q=v+8|0;x=v+4|0;w=v;c[l>>2]=a;c[j>>2]=b;c[k>>2]=d;c[m>>2]=e;c[u>>2]=f;if(!((c[j>>2]&1|0)==0&(c[j>>2]|0)>=16)){if((((c[m>>2]|0)<(c[j>>2]|0)|0)!=0|0)==0){fg(c[l>>2]|0,c[k>>2]|0,c[j>>2]|0,c[u>>2]|0);i=v;return}if((((c[m>>2]<<1|0)<=(c[j>>2]|0)|0)!=0|0)!=0){Xe(c[l>>2]|0,c[k>>2]|0,c[m>>2]|0);i=v;return}Xe(c[u>>2]|0,c[k>>2]|0,c[m>>2]|0);c[H>>2]=oe(c[l>>2]|0,c[u>>2]|0,c[j>>2]|0,(c[u>>2]|0)+(c[j>>2]<<2)|0,(c[m>>2]<<1)-(c[j>>2]|0)|0)|0;c[I>>2]=c[l>>2];c[J>>2]=(c[c[I>>2]>>2]|0)+(c[H>>2]|0);c[c[I>>2]>>2]=c[J>>2];if(!((c[J>>2]|0)>>>0<(c[H>>2]|0)>>>0)){i=v;return}do{b=(c[I>>2]|0)+4|0;c[I>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0);i=v;return}c[n>>2]=c[j>>2]>>1;f=c[u>>2]|0;if((((c[m>>2]|0)>(c[n>>2]|0)|0)!=0|0)!=0){c[D>>2]=f+(c[n>>2]<<2);c[B>>2]=c[u>>2];c[o>>2]=oe(c[u>>2]|0,c[k>>2]|0,c[n>>2]|0,(c[k>>2]|0)+(c[n>>2]<<2)|0,(c[m>>2]|0)-(c[n>>2]|0)|0)|0;c[E>>2]=c[u>>2];c[F>>2]=(c[c[E>>2]>>2]|0)+(c[o>>2]|0);c[c[E>>2]>>2]=c[F>>2];if((c[F>>2]|0)>>>0<(c[o>>2]|0)>>>0){do{b=(c[E>>2]|0)+4|0;c[E>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[C>>2]=c[n>>2]}else{c[D>>2]=f;c[B>>2]=c[k>>2];c[C>>2]=c[m>>2]}eg(c[l>>2]|0,c[n>>2]|0,c[B>>2]|0,c[C>>2]|0,c[D>>2]|0);if((((c[m>>2]|0)>(c[n>>2]|0)|0)!=0|0)!=0){c[s>>2]=(c[u>>2]|0)+(c[n>>2]<<1<<2)+8;c[o>>2]=re((c[u>>2]|0)+(c[n>>2]<<1<<2)+8|0,c[k>>2]|0,c[n>>2]|0,(c[k>>2]|0)+(c[n>>2]<<2)|0,(c[m>>2]|0)-(c[n>>2]|0)|0)|0;c[(c[u>>2]|0)+(c[n>>2]<<1<<2)+8+(c[n>>2]<<2)>>2]=0;c[z>>2]=(c[u>>2]|0)+(c[n>>2]<<1<<2)+8;c[A>>2]=(c[c[z>>2]>>2]|0)+(c[o>>2]|0);c[c[z>>2]>>2]=c[A>>2];if((c[A>>2]|0)>>>0<(c[o>>2]|0)>>>0){do{b=(c[z>>2]|0)+4|0;c[z>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}c[t>>2]=(c[n>>2]|0)+(c[(c[s>>2]|0)+(c[n>>2]<<2)>>2]|0)}else{c[s>>2]=c[k>>2];c[t>>2]=c[m>>2]}a:do{if((c[n>>2]|0)>=300){c[G>>2]=Ge(c[n>>2]|0,1)|0;c[y>>2]=(1<<c[G>>2])-1;while(1){if((c[n>>2]&c[y>>2]|0)==0){break a}c[G>>2]=(c[G>>2]|0)+ -1;c[y>>2]=c[y>>2]>>1}}else{c[G>>2]=0}}while(0);do{if((c[G>>2]|0)<4){y=c[u>>2]|0;if((((c[s>>2]|0)==(c[k>>2]|0)|0)!=0|0)==0){gg(y,c[s>>2]|0,c[n>>2]|0,c[u>>2]|0);break}Xe(y,c[k>>2]|0,c[m>>2]|0);c[t>>2]=(c[m>>2]<<1)-(c[n>>2]|0);c[o>>2]=re(c[u>>2]|0,c[u>>2]|0,c[n>>2]|0,(c[u>>2]|0)+(c[n>>2]<<2)|0,c[t>>2]|0)|0;c[(c[u>>2]|0)+(c[n>>2]<<2)>>2]=0;c[g>>2]=c[u>>2];c[h>>2]=(c[c[g>>2]>>2]|0)+(c[o>>2]|0);c[c[g>>2]>>2]=c[h>>2];if((c[h>>2]|0)>>>0<(c[o>>2]|0)>>>0){do{b=(c[g>>2]|0)+4|0;c[g>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}}else{a=Ie(c[u>>2]|0,c[n>>2]|0,c[s>>2]|0,c[t>>2]|0,c[s>>2]|0,c[t>>2]|0,c[G>>2]|0)|0;c[(c[u>>2]|0)+(c[n>>2]<<2)>>2]=a}}while(0);a=c[(c[u>>2]|0)+(c[n>>2]<<2)>>2]|0;c[o>>2]=a+(qe(c[l>>2]|0,c[l>>2]|0,c[u>>2]|0,c[n>>2]|0)|0);c[o>>2]=(c[o>>2]|0)+(c[c[l>>2]>>2]&1);ye(c[l>>2]|0,c[l>>2]|0,c[n>>2]|0,1)|0;c[p>>2]=c[o>>2]<<31;c[o>>2]=(c[o>>2]|0)>>>1;a=(c[l>>2]|0)+((c[n>>2]|0)-1<<2)|0;c[a>>2]=c[a>>2]|c[p>>2];c[q>>2]=c[l>>2];c[r>>2]=(c[c[q>>2]>>2]|0)+(c[o>>2]|0);c[c[q>>2]>>2]=c[r>>2];if((c[r>>2]|0)>>>0<(c[o>>2]|0)>>>0){do{b=(c[q>>2]|0)+4|0;c[q>>2]=b;a=(c[b>>2]|0)+1|0;c[b>>2]=a}while((a|0)==0)}if((((c[m>>2]<<1|0)<(c[j>>2]|0)|0)!=0|0)!=0){c[o>>2]=te((c[l>>2]|0)+(c[n>>2]<<2)|0,c[l>>2]|0,c[u>>2]|0,(c[m>>2]<<1)-(c[n>>2]|0)|0)|0;a=c[(c[u>>2]|0)+(c[n>>2]<<2)>>2]|0;c[o>>2]=a+(hg((c[u>>2]|0)+(c[m>>2]<<1<<2)+(0-(c[n>>2]|0)<<2)|0,(c[l>>2]|0)+(c[m>>2]<<1<<2)+(0-(c[n>>2]|0)<<2)|0,(c[u>>2]|0)+(c[m>>2]<<1<<2)+(0-(c[n>>2]|0)<<2)|0,(c[j>>2]|0)-(c[m>>2]<<1)|0,c[o>>2]|0)|0);c[o>>2]=se(c[l>>2]|0,c[l>>2]|0,c[m>>2]<<1,c[o>>2]|0)|0;i=v;return}a=c[(c[u>>2]|0)+(c[n>>2]<<2)>>2]|0;c[o>>2]=a+(te((c[l>>2]|0)+(c[n>>2]<<2)|0,c[l>>2]|0,c[u>>2]|0,c[n>>2]|0)|0);c[w>>2]=c[l>>2];c[x>>2]=c[c[w>>2]>>2];c[c[w>>2]>>2]=(c[x>>2]|0)-(c[o>>2]|0);if(!((c[x>>2]|0)>>>0<(c[o>>2]|0)>>>0)){i=v;return}do{b=(c[w>>2]|0)+4|0;c[w>>2]=b;a=c[b>>2]|0;c[b>>2]=a+ -1}while((a|0)==0);i=v;return}function fg(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+32|0;k=f+24|0;n=f+20|0;l=f+16|0;m=f+12|0;h=f+8|0;j=f+4|0;g=f;c[k>>2]=a;c[n>>2]=b;c[l>>2]=d;c[m>>2]=e;Xe(c[m>>2]|0,c[n>>2]|0,c[l>>2]|0);c[h>>2]=qe(c[k>>2]|0,c[m>>2]|0,(c[m>>2]|0)+(c[l>>2]<<2)|0,c[l>>2]|0)|0;c[g>>2]=c[k>>2];c[j>>2]=(c[c[g>>2]>>2]|0)+(c[h>>2]|0);c[c[g>>2]>>2]=c[j>>2];if(!((c[j>>2]|0)>>>0<(c[h>>2]|0)>>>0)){i=f;return}do{m=(c[g>>2]|0)+4|0;c[g>>2]=m;n=(c[m>>2]|0)+1|0;c[m>>2]=n}while((n|0)==0);i=f;return}function gg(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+32|0;k=f+24|0;n=f+20|0;l=f+16|0;m=f+12|0;h=f+8|0;j=f+4|0;g=f;c[k>>2]=a;c[n>>2]=b;c[l>>2]=d;c[m>>2]=e;Xe(c[m>>2]|0,c[n>>2]|0,(c[l>>2]|0)+1|0);a=c[(c[m>>2]|0)+(c[l>>2]<<1<<2)>>2]|0;c[h>>2]=a+(te(c[k>>2]|0,c[m>>2]|0,(c[m>>2]|0)+(c[l>>2]<<2)|0,c[l>>2]|0)|0);c[(c[k>>2]|0)+(c[l>>2]<<2)>>2]=0;c[g>>2]=c[k>>2];c[j>>2]=(c[c[g>>2]>>2]|0)+(c[h>>2]|0);c[c[g>>2]>>2]=c[j>>2];if(!((c[j>>2]|0)>>>0<(c[h>>2]|0)>>>0)){i=f;return}do{m=(c[g>>2]|0)+4|0;c[g>>2]=m;n=(c[m>>2]|0)+1|0;c[m>>2]=n}while((n|0)==0);i=f;return}function hg(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+32|0;l=h+20|0;n=h+16|0;m=h+12|0;k=h+8|0;j=h+4|0;g=h;c[l>>2]=a;c[n>>2]=b;c[m>>2]=d;c[k>>2]=e;c[j>>2]=f;c[g>>2]=te(c[l>>2]|0,c[n>>2]|0,c[m>>2]|0,c[k>>2]|0)|0;a=se(c[l>>2]|0,c[l>>2]|0,c[k>>2]|0,c[j>>2]|0)|0;c[g>>2]=(c[g>>2]|0)+a;i=h;return c[g>>2]|0}function ig(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;d=i;i=i+16|0;b=d+8|0;f=d+4|0;e=d;c[f>>2]=a;g=c[f>>2]|0;do{if((c[f>>2]|0)>=16){a=c[f>>2]|0;if((g|0)<61){c[b>>2]=a+1&-2;break}g=c[f>>2]|0;if((a|0)<121){c[b>>2]=g+3&-4;break}c[e>>2]=g+1>>1;if((c[e>>2]|0)>=360){g=c[e>>2]|0;c[b>>2]=(He(g,Ge(c[e>>2]|0,1)|0)|0)<<1;break}else{c[b>>2]=(c[f>>2]|0)+7&-8;break}}else{c[b>>2]=g}}while(0);i=d;return c[b>>2]|0}function jg(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0;k=i;i=i+176|0;D=k+172|0;j=k+168|0;_=k+164|0;o=k+160|0;n=k+156|0;q=k+152|0;l=k+148|0;C=k+144|0;G=k+140|0;H=k+136|0;B=k+132|0;A=k+128|0;X=k+124|0;Y=k+120|0;m=k+116|0;E=k+112|0;S=k+108|0;T=k+104|0;V=k+100|0;w=k+96|0;x=k+92|0;y=k+88|0;z=k+84|0;s=k+80|0;u=k+76|0;t=k+72|0;v=k+68|0;p=k+64|0;r=k+60|0;F=k+56|0;h=k+52|0;O=k+48|0;P=k+44|0;Q=k+40|0;R=k+36|0;K=k+32|0;M=k+28|0;L=k+24|0;N=k+20|0;I=k+16|0;J=k+12|0;U=k+8|0;W=k+4|0;Z=k;c[D>>2]=a;c[j>>2]=b;c[_>>2]=d;c[o>>2]=e;c[n>>2]=f;c[q>>2]=g;c[j>>2]=(c[j>>2]|0)+(c[_>>2]<<2);c[l>>2]=(ff((c[j>>2]|0)+(0-(c[n>>2]|0)<<2)|0,c[o>>2]|0,c[n>>2]|0)|0)>=0;if((c[l>>2]|0)!=0){te((c[j>>2]|0)+(0-(c[n>>2]|0)<<2)|0,(c[j>>2]|0)+(0-(c[n>>2]|0)<<2)|0,c[o>>2]|0,c[n>>2]|0)|0}c[D>>2]=(c[D>>2]|0)+((c[_>>2]|0)-(c[n>>2]|0)<<2);c[n>>2]=(c[n>>2]|0)-2;c[B>>2]=c[(c[o>>2]|0)+((c[n>>2]|0)+1<<2)>>2];c[A>>2]=c[(c[o>>2]|0)+((c[n>>2]|0)+0<<2)>>2];c[j>>2]=(c[j>>2]|0)+ -8;c[G>>2]=c[(c[j>>2]|0)+4>>2];c[C>>2]=(c[_>>2]|0)-((c[n>>2]|0)+2);while(1){if((c[C>>2]|0)<=0){break}c[j>>2]=(c[j>>2]|0)+ -4;if((((c[G>>2]|0)==(c[B>>2]|0)|0)!=0|0)!=0?(c[(c[j>>2]|0)+4>>2]|0)==(c[A>>2]|0):0){c[m>>2]=-1;we((c[j>>2]|0)+(0-(c[n>>2]|0)<<2)|0,c[o>>2]|0,(c[n>>2]|0)+2|0,c[m>>2]|0)|0;c[G>>2]=c[(c[j>>2]|0)+4>>2]}else{c[p>>2]=c[G>>2];c[r>>2]=c[q>>2];c[s>>2]=c[p>>2]&65535;c[t>>2]=(c[p>>2]|0)>>>16;c[u>>2]=c[r>>2]&65535;c[v>>2]=(c[r>>2]|0)>>>16;c[w>>2]=ea(c[s>>2]|0,c[u>>2]|0)|0;c[x>>2]=ea(c[s>>2]|0,c[v>>2]|0)|0;c[y>>2]=ea(c[t>>2]|0,c[u>>2]|0)|0;c[z>>2]=ea(c[t>>2]|0,c[v>>2]|0)|0;c[x>>2]=(c[x>>2]|0)+((c[w>>2]|0)>>>16);c[x>>2]=(c[x>>2]|0)+(c[y>>2]|0);if((c[x>>2]|0)>>>0<(c[y>>2]|0)>>>0){c[z>>2]=(c[z>>2]|0)+65536}c[m>>2]=(c[z>>2]|0)+((c[x>>2]|0)>>>16);c[E>>2]=(c[x>>2]<<16)+(c[w>>2]&65535);c[F>>2]=(c[E>>2]|0)+(c[(c[j>>2]|0)+4>>2]|0);c[m>>2]=(c[m>>2]|0)+(c[G>>2]|0)+((c[F>>2]|0)>>>0<(c[E>>2]|0)>>>0);c[E>>2]=c[F>>2];c[G>>2]=(c[(c[j>>2]|0)+4>>2]|0)-(ea(c[B>>2]|0,c[m>>2]|0)|0);c[h>>2]=(c[c[j>>2]>>2]|0)-(c[A>>2]|0);c[G>>2]=(c[G>>2]|0)-(c[B>>2]|0)-((c[c[j>>2]>>2]|0)>>>0<(c[A>>2]|0)>>>0);c[H>>2]=c[h>>2];c[I>>2]=c[A>>2];c[J>>2]=c[m>>2];c[K>>2]=c[I>>2]&65535;c[L>>2]=(c[I>>2]|0)>>>16;c[M>>2]=c[J>>2]&65535;c[N>>2]=(c[J>>2]|0)>>>16;c[O>>2]=ea(c[K>>2]|0,c[M>>2]|0)|0;c[P>>2]=ea(c[K>>2]|0,c[N>>2]|0)|0;c[Q>>2]=ea(c[L>>2]|0,c[M>>2]|0)|0;c[R>>2]=ea(c[L>>2]|0,c[N>>2]|0)|0;c[P>>2]=(c[P>>2]|0)+((c[O>>2]|0)>>>16);c[P>>2]=(c[P>>2]|0)+(c[Q>>2]|0);if((c[P>>2]|0)>>>0<(c[Q>>2]|0)>>>0){c[R>>2]=(c[R>>2]|0)+65536}c[S>>2]=(c[R>>2]|0)+((c[P>>2]|0)>>>16);c[T>>2]=(c[P>>2]<<16)+(c[O>>2]&65535);c[U>>2]=(c[H>>2]|0)-(c[T>>2]|0);c[G>>2]=(c[G>>2]|0)-(c[S>>2]|0)-((c[H>>2]|0)>>>0<(c[T>>2]|0)>>>0);c[H>>2]=c[U>>2];c[m>>2]=(c[m>>2]|0)+1;c[V>>2]=0-((c[G>>2]|0)>>>0>=(c[E>>2]|0)>>>0);c[m>>2]=(c[m>>2]|0)+(c[V>>2]|0);c[W>>2]=(c[H>>2]|0)+(c[V>>2]&c[A>>2]);c[G>>2]=(c[G>>2]|0)+(c[V>>2]&c[B>>2])+((c[W>>2]|0)>>>0<(c[H>>2]|0)>>>0);c[H>>2]=c[W>>2];do{if((((c[G>>2]|0)>>>0>=(c[B>>2]|0)>>>0|0)!=0|0)!=0){if(!((c[G>>2]|0)>>>0>(c[B>>2]|0)>>>0)?!((c[H>>2]|0)>>>0>=(c[A>>2]|0)>>>0):0){break}c[m>>2]=(c[m>>2]|0)+1;c[Z>>2]=(c[H>>2]|0)-(c[A>>2]|0);c[G>>2]=(c[G>>2]|0)-(c[B>>2]|0)-((c[H>>2]|0)>>>0<(c[A>>2]|0)>>>0);c[H>>2]=c[Z>>2]}}while(0);c[X>>2]=we((c[j>>2]|0)+(0-(c[n>>2]|0)<<2)|0,c[o>>2]|0,c[n>>2]|0,c[m>>2]|0)|0;c[Y>>2]=(c[H>>2]|0)>>>0<(c[X>>2]|0)>>>0;c[H>>2]=(c[H>>2]|0)-(c[X>>2]|0);c[X>>2]=(c[G>>2]|0)>>>0<(c[Y>>2]|0)>>>0;c[G>>2]=(c[G>>2]|0)-(c[Y>>2]|0);c[c[j>>2]>>2]=c[H>>2];if((((c[X>>2]|0)!=0|0)!=0|0)!=0){a=c[B>>2]|0;a=a+(qe((c[j>>2]|0)+(0-(c[n>>2]|0)<<2)|0,(c[j>>2]|0)+(0-(c[n>>2]|0)<<2)|0,c[o>>2]|0,(c[n>>2]|0)+1|0)|0)|0;c[G>>2]=(c[G>>2]|0)+a;c[m>>2]=(c[m>>2]|0)+ -1}}b=c[m>>2]|0;a=(c[D>>2]|0)+ -4|0;c[D>>2]=a;c[a>>2]=b;c[C>>2]=(c[C>>2]|0)+ -1}c[(c[j>>2]|0)+4>>2]=c[G>>2];i=k;return c[l>>2]|0}function kg(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0;Ca=i;i=i+432|0;l=Ca+416|0;ka=Ca+412|0;gb=Ca+408|0;m=Ca+404|0;X=Ca+400|0;Q=Ca+396|0;Da=Ca+392|0;fb=Ca+388|0;Ba=Ca+384|0;T=Ca+380|0;q=Ca+376|0;t=Ca+372|0;r=Ca+368|0;p=Ca+364|0;Y=Ca+360|0;k=Ca+356|0;o=Ca+352|0;Oa=Ca+348|0;$a=Ca+344|0;ab=Ca+340|0;cb=Ca+336|0;Ka=Ca+332|0;La=Ca+328|0;Ma=Ca+324|0;Na=Ca+320|0;Ga=Ca+316|0;Ia=Ca+312|0;Ha=Ca+308|0;Ja=Ca+304|0;Ea=Ca+300|0;Fa=Ca+296|0;Pa=Ca+292|0;Qa=Ca+288|0;Xa=Ca+284|0;Ya=Ca+280|0;Za=Ca+276|0;_a=Ca+272|0;Ta=Ca+268|0;Va=Ca+264|0;Ua=Ca+260|0;Wa=Ca+256|0;Ra=Ca+252|0;Sa=Ca+248|0;bb=Ca+244|0;db=Ca+240|0;eb=Ca+236|0;fa=Ca+232|0;aa=Ca+228|0;ca=Ca+224|0;ga=Ca+220|0;j=Ca+216|0;ja=Ca+212|0;Aa=Ca+208|0;ia=Ca+204|0;wa=Ca+200|0;ya=Ca+196|0;xa=Ca+192|0;za=Ca+188|0;ua=Ca+184|0;va=Ca+180|0;la=Ca+176|0;ma=Ca+172|0;ba=Ca+168|0;$=Ca+164|0;ta=Ca+160|0;_=Ca+156|0;pa=Ca+152|0;ra=Ca+148|0;qa=Ca+144|0;sa=Ca+140|0;na=Ca+136|0;oa=Ca+132|0;da=Ca+128|0;ha=Ca+124|0;Z=Ca+120|0;n=Ca+116|0;A=Ca+112|0;w=Ca+108|0;y=Ca+104|0;B=Ca+100|0;F=Ca+96|0;E=Ca+92|0;W=Ca+88|0;D=Ca+84|0;S=Ca+80|0;U=Ca+76|0;h=Ca+72|0;V=Ca+68|0;P=Ca+64|0;R=Ca+60|0;G=Ca+56|0;H=Ca+52|0;x=Ca+48|0;v=Ca+44|0;O=Ca+40|0;u=Ca+36|0;K=Ca+32|0;M=Ca+28|0;L=Ca+24|0;N=Ca+20|0;I=Ca+16|0;J=Ca+12|0;z=Ca+8|0;C=Ca+4|0;s=Ca;c[l>>2]=a;c[ka>>2]=b;c[gb>>2]=d;c[m>>2]=e;c[X>>2]=f;c[Q>>2]=g;c[ka>>2]=(c[ka>>2]|0)+(c[gb>>2]<<2);c[fb>>2]=(c[gb>>2]|0)-(c[X>>2]|0);if(((c[fb>>2]|0)+1|0)<(c[X>>2]|0)){c[m>>2]=(c[m>>2]|0)+((c[X>>2]|0)-((c[fb>>2]|0)+1)<<2);c[X>>2]=(c[fb>>2]|0)+1}c[Da>>2]=(ff((c[ka>>2]|0)+(0-(c[X>>2]|0)<<2)|0,c[m>>2]|0,c[X>>2]|0)|0)>=0;if((c[Da>>2]|0)!=0){te((c[ka>>2]|0)+(0-(c[X>>2]|0)<<2)|0,(c[ka>>2]|0)+(0-(c[X>>2]|0)<<2)|0,c[m>>2]|0,c[X>>2]|0)|0}c[l>>2]=(c[l>>2]|0)+(c[fb>>2]<<2);c[X>>2]=(c[X>>2]|0)-2;c[t>>2]=c[(c[m>>2]|0)+((c[X>>2]|0)+1<<2)>>2];c[r>>2]=c[(c[m>>2]|0)+((c[X>>2]|0)+0<<2)>>2];c[ka>>2]=(c[ka>>2]|0)+ -8;c[T>>2]=c[(c[ka>>2]|0)+4>>2];c[Ba>>2]=(c[fb>>2]|0)-((c[X>>2]|0)+2);while(1){if((c[Ba>>2]|0)<0){break}c[ka>>2]=(c[ka>>2]|0)+ -4;if((((c[T>>2]|0)==(c[t>>2]|0)|0)!=0|0)!=0?(c[(c[ka>>2]|0)+4>>2]|0)==(c[r>>2]|0):0){c[k>>2]=-1;we((c[ka>>2]|0)+(0-(c[X>>2]|0)<<2)|0,c[m>>2]|0,(c[X>>2]|0)+2|0,c[k>>2]|0)|0;c[T>>2]=c[(c[ka>>2]|0)+4>>2]}else{c[Ea>>2]=c[T>>2];c[Fa>>2]=c[Q>>2];c[Ga>>2]=c[Ea>>2]&65535;c[Ha>>2]=(c[Ea>>2]|0)>>>16;c[Ia>>2]=c[Fa>>2]&65535;c[Ja>>2]=(c[Fa>>2]|0)>>>16;c[Ka>>2]=ea(c[Ga>>2]|0,c[Ia>>2]|0)|0;c[La>>2]=ea(c[Ga>>2]|0,c[Ja>>2]|0)|0;c[Ma>>2]=ea(c[Ha>>2]|0,c[Ia>>2]|0)|0;c[Na>>2]=ea(c[Ha>>2]|0,c[Ja>>2]|0)|0;c[La>>2]=(c[La>>2]|0)+((c[Ka>>2]|0)>>>16);c[La>>2]=(c[La>>2]|0)+(c[Ma>>2]|0);if((c[La>>2]|0)>>>0<(c[Ma>>2]|0)>>>0){c[Na>>2]=(c[Na>>2]|0)+65536}c[k>>2]=(c[Na>>2]|0)+((c[La>>2]|0)>>>16);c[Oa>>2]=(c[La>>2]<<16)+(c[Ka>>2]&65535);c[Pa>>2]=(c[Oa>>2]|0)+(c[(c[ka>>2]|0)+4>>2]|0);c[k>>2]=(c[k>>2]|0)+(c[T>>2]|0)+((c[Pa>>2]|0)>>>0<(c[Oa>>2]|0)>>>0);c[Oa>>2]=c[Pa>>2];c[T>>2]=(c[(c[ka>>2]|0)+4>>2]|0)-(ea(c[t>>2]|0,c[k>>2]|0)|0);c[Qa>>2]=(c[c[ka>>2]>>2]|0)-(c[r>>2]|0);c[T>>2]=(c[T>>2]|0)-(c[t>>2]|0)-((c[c[ka>>2]>>2]|0)>>>0<(c[r>>2]|0)>>>0);c[q>>2]=c[Qa>>2];c[Ra>>2]=c[r>>2];c[Sa>>2]=c[k>>2];c[Ta>>2]=c[Ra>>2]&65535;c[Ua>>2]=(c[Ra>>2]|0)>>>16;c[Va>>2]=c[Sa>>2]&65535;c[Wa>>2]=(c[Sa>>2]|0)>>>16;c[Xa>>2]=ea(c[Ta>>2]|0,c[Va>>2]|0)|0;c[Ya>>2]=ea(c[Ta>>2]|0,c[Wa>>2]|0)|0;c[Za>>2]=ea(c[Ua>>2]|0,c[Va>>2]|0)|0;c[_a>>2]=ea(c[Ua>>2]|0,c[Wa>>2]|0)|0;c[Ya>>2]=(c[Ya>>2]|0)+((c[Xa>>2]|0)>>>16);c[Ya>>2]=(c[Ya>>2]|0)+(c[Za>>2]|0);if((c[Ya>>2]|0)>>>0<(c[Za>>2]|0)>>>0){c[_a>>2]=(c[_a>>2]|0)+65536}c[$a>>2]=(c[_a>>2]|0)+((c[Ya>>2]|0)>>>16);c[ab>>2]=(c[Ya>>2]<<16)+(c[Xa>>2]&65535);c[bb>>2]=(c[q>>2]|0)-(c[ab>>2]|0);c[T>>2]=(c[T>>2]|0)-(c[$a>>2]|0)-((c[q>>2]|0)>>>0<(c[ab>>2]|0)>>>0);c[q>>2]=c[bb>>2];c[k>>2]=(c[k>>2]|0)+1;c[cb>>2]=0-((c[T>>2]|0)>>>0>=(c[Oa>>2]|0)>>>0);c[k>>2]=(c[k>>2]|0)+(c[cb>>2]|0);c[db>>2]=(c[q>>2]|0)+(c[cb>>2]&c[r>>2]);c[T>>2]=(c[T>>2]|0)+(c[cb>>2]&c[t>>2])+((c[db>>2]|0)>>>0<(c[q>>2]|0)>>>0);c[q>>2]=c[db>>2];do{if((((c[T>>2]|0)>>>0>=(c[t>>2]|0)>>>0|0)!=0|0)!=0){if(!((c[T>>2]|0)>>>0>(c[t>>2]|0)>>>0)?!((c[q>>2]|0)>>>0>=(c[r>>2]|0)>>>0):0){break}c[k>>2]=(c[k>>2]|0)+1;c[eb>>2]=(c[q>>2]|0)-(c[r>>2]|0);c[T>>2]=(c[T>>2]|0)-(c[t>>2]|0)-((c[q>>2]|0)>>>0<(c[r>>2]|0)>>>0);c[q>>2]=c[eb>>2]}}while(0);c[p>>2]=we((c[ka>>2]|0)+(0-(c[X>>2]|0)<<2)|0,c[m>>2]|0,c[X>>2]|0,c[k>>2]|0)|0;c[Y>>2]=(c[q>>2]|0)>>>0<(c[p>>2]|0)>>>0;c[q>>2]=(c[q>>2]|0)-(c[p>>2]|0);c[p>>2]=(c[T>>2]|0)>>>0<(c[Y>>2]|0)>>>0;c[T>>2]=(c[T>>2]|0)-(c[Y>>2]|0);c[c[ka>>2]>>2]=c[q>>2];if((((c[p>>2]|0)!=0|0)!=0|0)!=0){gb=c[t>>2]|0;gb=gb+(qe((c[ka>>2]|0)+(0-(c[X>>2]|0)<<2)|0,(c[ka>>2]|0)+(0-(c[X>>2]|0)<<2)|0,c[m>>2]|0,(c[X>>2]|0)+1|0)|0)|0;c[T>>2]=(c[T>>2]|0)+gb;c[k>>2]=(c[k>>2]|0)+ -1}}a=c[k>>2]|0;gb=(c[l>>2]|0)+ -4|0;c[l>>2]=gb;c[gb>>2]=a;c[Ba>>2]=(c[Ba>>2]|0)+ -1}c[o>>2]=-1;if((c[X>>2]|0)>=0){c[Ba>>2]=c[X>>2];while(1){gb=(c[Ba>>2]|0)>0;c[ka>>2]=(c[ka>>2]|0)+ -4;g=(((c[T>>2]|0)>>>0>=(c[t>>2]&c[o>>2])>>>0|0)!=0|0)!=0;if(!gb){break}if(!g){c[ua>>2]=c[T>>2];c[va>>2]=c[Q>>2];c[wa>>2]=c[ua>>2]&65535;c[xa>>2]=(c[ua>>2]|0)>>>16;c[ya>>2]=c[va>>2]&65535;c[za>>2]=(c[va>>2]|0)>>>16;c[j>>2]=ea(c[wa>>2]|0,c[ya>>2]|0)|0;c[ja>>2]=ea(c[wa>>2]|0,c[za>>2]|0)|0;c[Aa>>2]=ea(c[xa>>2]|0,c[ya>>2]|0)|0;c[ia>>2]=ea(c[xa>>2]|0,c[za>>2]|0)|0;c[ja>>2]=(c[ja>>2]|0)+((c[j>>2]|0)>>>16);c[ja>>2]=(c[ja>>2]|0)+(c[Aa>>2]|0);if((c[ja>>2]|0)>>>0<(c[Aa>>2]|0)>>>0){c[ia>>2]=(c[ia>>2]|0)+65536}c[k>>2]=(c[ia>>2]|0)+((c[ja>>2]|0)>>>16);c[fa>>2]=(c[ja>>2]<<16)+(c[j>>2]&65535);c[la>>2]=(c[fa>>2]|0)+(c[(c[ka>>2]|0)+4>>2]|0);c[k>>2]=(c[k>>2]|0)+(c[T>>2]|0)+((c[la>>2]|0)>>>0<(c[fa>>2]|0)>>>0);c[fa>>2]=c[la>>2];c[T>>2]=(c[(c[ka>>2]|0)+4>>2]|0)-(ea(c[t>>2]|0,c[k>>2]|0)|0);c[ma>>2]=(c[c[ka>>2]>>2]|0)-(c[r>>2]|0);c[T>>2]=(c[T>>2]|0)-(c[t>>2]|0)-((c[c[ka>>2]>>2]|0)>>>0<(c[r>>2]|0)>>>0);c[q>>2]=c[ma>>2];c[na>>2]=c[r>>2];c[oa>>2]=c[k>>2];c[pa>>2]=c[na>>2]&65535;c[qa>>2]=(c[na>>2]|0)>>>16;c[ra>>2]=c[oa>>2]&65535;c[sa>>2]=(c[oa>>2]|0)>>>16;c[ba>>2]=ea(c[pa>>2]|0,c[ra>>2]|0)|0;c[$>>2]=ea(c[pa>>2]|0,c[sa>>2]|0)|0;c[ta>>2]=ea(c[qa>>2]|0,c[ra>>2]|0)|0;c[_>>2]=ea(c[qa>>2]|0,c[sa>>2]|0)|0;c[$>>2]=(c[$>>2]|0)+((c[ba>>2]|0)>>>16);c[$>>2]=(c[$>>2]|0)+(c[ta>>2]|0);if((c[$>>2]|0)>>>0<(c[ta>>2]|0)>>>0){c[_>>2]=(c[_>>2]|0)+65536}c[aa>>2]=(c[_>>2]|0)+((c[$>>2]|0)>>>16);c[ca>>2]=(c[$>>2]<<16)+(c[ba>>2]&65535);c[da>>2]=(c[q>>2]|0)-(c[ca>>2]|0);c[T>>2]=(c[T>>2]|0)-(c[aa>>2]|0)-((c[q>>2]|0)>>>0<(c[ca>>2]|0)>>>0);c[q>>2]=c[da>>2];c[k>>2]=(c[k>>2]|0)+1;c[ga>>2]=0-((c[T>>2]|0)>>>0>=(c[fa>>2]|0)>>>0);c[k>>2]=(c[k>>2]|0)+(c[ga>>2]|0);c[ha>>2]=(c[q>>2]|0)+(c[ga>>2]&c[r>>2]);c[T>>2]=(c[T>>2]|0)+(c[ga>>2]&c[t>>2])+((c[ha>>2]|0)>>>0<(c[q>>2]|0)>>>0);c[q>>2]=c[ha>>2];do{if((((c[T>>2]|0)>>>0>=(c[t>>2]|0)>>>0|0)!=0|0)!=0){if(!((c[T>>2]|0)>>>0>(c[t>>2]|0)>>>0)?!((c[q>>2]|0)>>>0>=(c[r>>2]|0)>>>0):0){break}c[k>>2]=(c[k>>2]|0)+1;c[Z>>2]=(c[q>>2]|0)-(c[r>>2]|0);c[T>>2]=(c[T>>2]|0)-(c[t>>2]|0)-((c[q>>2]|0)>>>0<(c[r>>2]|0)>>>0);c[q>>2]=c[Z>>2]}}while(0);c[p>>2]=we((c[ka>>2]|0)+(0-(c[X>>2]|0)<<2)|0,c[m>>2]|0,c[X>>2]|0,c[k>>2]|0)|0;c[Y>>2]=(c[q>>2]|0)>>>0<(c[p>>2]|0)>>>0;c[q>>2]=(c[q>>2]|0)-(c[p>>2]|0);c[p>>2]=(c[T>>2]|0)>>>0<(c[Y>>2]|0)>>>0;c[T>>2]=(c[T>>2]|0)-(c[Y>>2]|0);c[c[ka>>2]>>2]=c[q>>2];if((((c[p>>2]|0)!=0|0)!=0|0)!=0){gb=c[t>>2]|0;gb=gb+(qe((c[ka>>2]|0)+(0-(c[X>>2]|0)<<2)|0,(c[ka>>2]|0)+(0-(c[X>>2]|0)<<2)|0,c[m>>2]|0,(c[X>>2]|0)+1|0)|0)|0;c[T>>2]=(c[T>>2]|0)+gb;c[k>>2]=(c[k>>2]|0)+ -1}}else{c[k>>2]=-1;c[p>>2]=we((c[ka>>2]|0)+(0-(c[X>>2]|0)<<2)|0,c[m>>2]|0,(c[X>>2]|0)+2|0,c[k>>2]|0)|0;do{if((((c[T>>2]|0)!=(c[p>>2]|0)|0)!=0|0)!=0){if((c[T>>2]|0)>>>0<(c[p>>2]&c[o>>2])>>>0){c[k>>2]=(c[k>>2]|0)+ -1;qe((c[ka>>2]|0)+(0-(c[X>>2]|0)<<2)|0,(c[ka>>2]|0)+(0-(c[X>>2]|0)<<2)|0,c[m>>2]|0,(c[X>>2]|0)+2|0)|0;break}else{c[o>>2]=0;break}}}while(0);c[T>>2]=c[(c[ka>>2]|0)+4>>2]}a=c[k>>2]|0;gb=(c[l>>2]|0)+ -4|0;c[l>>2]=gb;c[gb>>2]=a;c[X>>2]=(c[X>>2]|0)+ -1;c[m>>2]=(c[m>>2]|0)+4;c[Ba>>2]=(c[Ba>>2]|0)+ -1}if(g){c[k>>2]=-1;c[p>>2]=we(c[ka>>2]|0,c[m>>2]|0,2,c[k>>2]|0)|0;do{if((((c[T>>2]|0)!=(c[p>>2]|0)|0)!=0|0)!=0){if((c[T>>2]|0)>>>0<(c[p>>2]&c[o>>2])>>>0){c[k>>2]=(c[k>>2]|0)+ -1;c[n>>2]=(c[c[ka>>2]>>2]|0)+(c[c[m>>2]>>2]|0);c[(c[ka>>2]|0)+4>>2]=(c[(c[ka>>2]|0)+4>>2]|0)+(c[(c[m>>2]|0)+4>>2]|0)+((c[n>>2]|0)>>>0<(c[c[ka>>2]>>2]|0)>>>0);c[c[ka>>2]>>2]=c[n>>2];break}else{c[o>>2]=0;break}}}while(0);c[T>>2]=c[(c[ka>>2]|0)+4>>2]}else{c[P>>2]=c[T>>2];c[R>>2]=c[Q>>2];c[S>>2]=c[P>>2]&65535;c[h>>2]=(c[P>>2]|0)>>>16;c[U>>2]=c[R>>2]&65535;c[V>>2]=(c[R>>2]|0)>>>16;c[F>>2]=ea(c[S>>2]|0,c[U>>2]|0)|0;c[E>>2]=ea(c[S>>2]|0,c[V>>2]|0)|0;c[W>>2]=ea(c[h>>2]|0,c[U>>2]|0)|0;c[D>>2]=ea(c[h>>2]|0,c[V>>2]|0)|0;c[E>>2]=(c[E>>2]|0)+((c[F>>2]|0)>>>16);c[E>>2]=(c[E>>2]|0)+(c[W>>2]|0);if((c[E>>2]|0)>>>0<(c[W>>2]|0)>>>0){c[D>>2]=(c[D>>2]|0)+65536}c[k>>2]=(c[D>>2]|0)+((c[E>>2]|0)>>>16);c[A>>2]=(c[E>>2]<<16)+(c[F>>2]&65535);c[G>>2]=(c[A>>2]|0)+(c[(c[ka>>2]|0)+4>>2]|0);c[k>>2]=(c[k>>2]|0)+(c[T>>2]|0)+((c[G>>2]|0)>>>0<(c[A>>2]|0)>>>0);c[A>>2]=c[G>>2];c[T>>2]=(c[(c[ka>>2]|0)+4>>2]|0)-(ea(c[t>>2]|0,c[k>>2]|0)|0);c[H>>2]=(c[c[ka>>2]>>2]|0)-(c[r>>2]|0);c[T>>2]=(c[T>>2]|0)-(c[t>>2]|0)-((c[c[ka>>2]>>2]|0)>>>0<(c[r>>2]|0)>>>0);c[q>>2]=c[H>>2];c[I>>2]=c[r>>2];c[J>>2]=c[k>>2];c[K>>2]=c[I>>2]&65535;c[L>>2]=(c[I>>2]|0)>>>16;c[M>>2]=c[J>>2]&65535;c[N>>2]=(c[J>>2]|0)>>>16;c[x>>2]=ea(c[K>>2]|0,c[M>>2]|0)|0;c[v>>2]=ea(c[K>>2]|0,c[N>>2]|0)|0;c[O>>2]=ea(c[L>>2]|0,c[M>>2]|0)|0;c[u>>2]=ea(c[L>>2]|0,c[N>>2]|0)|0;c[v>>2]=(c[v>>2]|0)+((c[x>>2]|0)>>>16);c[v>>2]=(c[v>>2]|0)+(c[O>>2]|0);if((c[v>>2]|0)>>>0<(c[O>>2]|0)>>>0){c[u>>2]=(c[u>>2]|0)+65536}c[w>>2]=(c[u>>2]|0)+((c[v>>2]|0)>>>16);c[y>>2]=(c[v>>2]<<16)+(c[x>>2]&65535);c[z>>2]=(c[q>>2]|0)-(c[y>>2]|0);c[T>>2]=(c[T>>2]|0)-(c[w>>2]|0)-((c[q>>2]|0)>>>0<(c[y>>2]|0)>>>0);c[q>>2]=c[z>>2];c[k>>2]=(c[k>>2]|0)+1;c[B>>2]=0-((c[T>>2]|0)>>>0>=(c[A>>2]|0)>>>0);c[k>>2]=(c[k>>2]|0)+(c[B>>2]|0);c[C>>2]=(c[q>>2]|0)+(c[B>>2]&c[r>>2]);c[T>>2]=(c[T>>2]|0)+(c[B>>2]&c[t>>2])+((c[C>>2]|0)>>>0<(c[q>>2]|0)>>>0);c[q>>2]=c[C>>2];do{if((((c[T>>2]|0)>>>0>=(c[t>>2]|0)>>>0|0)!=0|0)!=0){if(!((c[T>>2]|0)>>>0>(c[t>>2]|0)>>>0)?!((c[q>>2]|0)>>>0>=(c[r>>2]|0)>>>0):0){break}c[k>>2]=(c[k>>2]|0)+1;c[s>>2]=(c[q>>2]|0)-(c[r>>2]|0);c[T>>2]=(c[T>>2]|0)-(c[t>>2]|0)-((c[q>>2]|0)>>>0<(c[r>>2]|0)>>>0);c[q>>2]=c[s>>2]}}while(0);c[(c[ka>>2]|0)+4>>2]=c[T>>2];c[c[ka>>2]>>2]=c[q>>2]}a=c[k>>2]|0;gb=(c[l>>2]|0)+ -4|0;c[l>>2]=gb;c[gb>>2]=a}if(((((c[(c[ka>>2]|0)+4>>2]|0)==(c[T>>2]|0)^1)&1|0)!=0|0)!=0){Hd(13896,196,13960)}else{i=Ca;return c[Da>>2]|0}return 0}function lg(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;s=i;i=i+48|0;q=s+40|0;l=s+36|0;n=s+32|0;r=s+28|0;t=s+24|0;p=s+20|0;m=s+16|0;h=s+12|0;k=s+8|0;o=s+4|0;j=s;c[q>>2]=a;c[l>>2]=b;c[n>>2]=d;c[r>>2]=e;c[t>>2]=f;c[p>>2]=g;c[m>>2]=c[r>>2]>>1;c[h>>2]=(c[r>>2]|0)-(c[m>>2]|0);f=(c[q>>2]|0)+(c[m>>2]<<2)|0;g=(c[l>>2]|0)+(c[m>>2]<<1<<2)|0;if((c[h>>2]|0)>=50){c[o>>2]=lg(f,g,(c[n>>2]|0)+(c[m>>2]<<2)|0,c[h>>2]|0,c[t>>2]|0,c[p>>2]|0)|0}else{c[o>>2]=jg(f,g,c[h>>2]<<1,(c[n>>2]|0)+(c[m>>2]<<2)|0,c[h>>2]|0,c[c[t>>2]>>2]|0)|0}De(c[p>>2]|0,(c[q>>2]|0)+(c[m>>2]<<2)|0,c[h>>2]|0,c[n>>2]|0,c[m>>2]|0)|0;c[k>>2]=te((c[l>>2]|0)+(c[m>>2]<<2)|0,(c[l>>2]|0)+(c[m>>2]<<2)|0,c[p>>2]|0,c[r>>2]|0)|0;if((c[o>>2]|0)!=0){a=te((c[l>>2]|0)+(c[r>>2]<<2)|0,(c[l>>2]|0)+(c[r>>2]<<2)|0,c[n>>2]|0,c[m>>2]|0)|0;c[k>>2]=(c[k>>2]|0)+a}while(1){if((c[k>>2]|0)==0){break}a=se((c[q>>2]|0)+(c[m>>2]<<2)|0,(c[q>>2]|0)+(c[m>>2]<<2)|0,c[h>>2]|0,1)|0;c[o>>2]=(c[o>>2]|0)-a;a=qe((c[l>>2]|0)+(c[m>>2]<<2)|0,(c[l>>2]|0)+(c[m>>2]<<2)|0,c[n>>2]|0,c[r>>2]|0)|0;c[k>>2]=(c[k>>2]|0)-a}f=c[q>>2]|0;g=(c[l>>2]|0)+(c[h>>2]<<2)|0;if((c[m>>2]|0)>=50){c[j>>2]=lg(f,g,(c[n>>2]|0)+(c[h>>2]<<2)|0,c[m>>2]|0,c[t>>2]|0,c[p>>2]|0)|0}else{c[j>>2]=jg(f,g,c[m>>2]<<1,(c[n>>2]|0)+(c[h>>2]<<2)|0,c[m>>2]|0,c[c[t>>2]>>2]|0)|0}De(c[p>>2]|0,c[n>>2]|0,c[h>>2]|0,c[q>>2]|0,c[m>>2]|0)|0;c[k>>2]=te(c[l>>2]|0,c[l>>2]|0,c[p>>2]|0,c[r>>2]|0)|0;if((c[j>>2]|0)!=0){a=te((c[l>>2]|0)+(c[m>>2]<<2)|0,(c[l>>2]|0)+(c[m>>2]<<2)|0,c[n>>2]|0,c[h>>2]|0)|0;c[k>>2]=(c[k>>2]|0)+a}while(1){if((c[k>>2]|0)==0){break}se(c[q>>2]|0,c[q>>2]|0,c[m>>2]|0,1)|0;a=qe(c[l>>2]|0,c[l>>2]|0,c[n>>2]|0,c[r>>2]|0)|0;c[k>>2]=(c[k>>2]|0)-a}i=s;return c[o>>2]|0}function mg(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0;r=i;i=i+192|0;k=r+188|0;n=r+184|0;t=r+180|0;p=r+176|0;h=r+172|0;s=r+168|0;l=r+164|0;m=r+160|0;o=r+156|0;q=r+152|0;j=r+148|0;v=r+144|0;P=r+140|0;w=r+136|0;z=r+132|0;x=r+128|0;B=r+124|0;J=r+120|0;F=r+116|0;H=r+112|0;K=r+108|0;N=r+104|0;M=r+100|0;ca=r+96|0;u=r+92|0;_=r+88|0;aa=r+84|0;$=r+80|0;ba=r+76|0;Y=r+72|0;Z=r+68|0;O=r+64|0;Q=r+60|0;G=r+56|0;E=r+52|0;X=r+48|0;D=r+44|0;T=r+40|0;V=r+36|0;U=r+32|0;W=r+28|0;R=r+24|0;S=r+20|0;I=r+16|0;L=r+12|0;C=r+8|0;y=r+4|0;A=r;c[k>>2]=a;c[n>>2]=b;c[t>>2]=d;c[p>>2]=e;c[h>>2]=f;c[s>>2]=g;c[j>>2]=0;a=i;i=i+((1*(c[h>>2]<<2)|0)+15&-16)|0;c[q>>2]=a;c[l>>2]=(c[t>>2]|0)-(c[h>>2]|0);c[k>>2]=(c[k>>2]|0)+(c[l>>2]<<2);c[n>>2]=(c[n>>2]|0)+(c[t>>2]<<2);c[p>>2]=(c[p>>2]|0)+(c[h>>2]<<2);a:do{if((c[l>>2]|0)<=(c[h>>2]|0)){c[k>>2]=(c[k>>2]|0)+(0-(c[l>>2]|0)<<2);c[n>>2]=(c[n>>2]|0)+(0-(c[l>>2]|0)<<2);u=c[k>>2]|0;t=(c[n>>2]|0)+(0-(c[l>>2]|0)<<2)|0;if((c[l>>2]|0)>=50){c[m>>2]=lg(u,t,(c[p>>2]|0)+(0-(c[l>>2]|0)<<2)|0,c[l>>2]|0,c[s>>2]|0,c[q>>2]|0)|0}else{c[m>>2]=jg(u,t,c[l>>2]<<1,(c[p>>2]|0)+(0-(c[l>>2]|0)<<2)|0,c[l>>2]|0,c[c[s>>2]>>2]|0)|0}if((c[l>>2]|0)!=(c[h>>2]|0)){s=c[q>>2]|0;if((c[l>>2]|0)>((c[h>>2]|0)-(c[l>>2]|0)|0)){De(s,c[k>>2]|0,c[l>>2]|0,(c[p>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[h>>2]|0)-(c[l>>2]|0)|0)|0}else{De(s,(c[p>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[h>>2]|0)-(c[l>>2]|0)|0,c[k>>2]|0,c[l>>2]|0)|0}c[o>>2]=te((c[n>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[n>>2]|0)+(0-(c[h>>2]|0)<<2)|0,c[q>>2]|0,c[h>>2]|0)|0;if((c[m>>2]|0)!=0){a=te((c[n>>2]|0)+(0-(c[h>>2]|0)<<2)+(c[l>>2]<<2)|0,(c[n>>2]|0)+(0-(c[h>>2]|0)<<2)+(c[l>>2]<<2)|0,(c[p>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[h>>2]|0)-(c[l>>2]|0)|0)|0;c[o>>2]=(c[o>>2]|0)+a}while(1){if((c[o>>2]|0)==0){break a}a=se(c[k>>2]|0,c[k>>2]|0,c[l>>2]|0,1)|0;c[m>>2]=(c[m>>2]|0)-a;a=qe((c[n>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[n>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[p>>2]|0)+(0-(c[h>>2]|0)<<2)|0,c[h>>2]|0)|0;c[o>>2]=(c[o>>2]|0)-a}}}else{do{c[l>>2]=(c[l>>2]|0)-(c[h>>2]|0)}while((c[l>>2]|0)>(c[h>>2]|0));c[k>>2]=(c[k>>2]|0)+(0-(c[l>>2]|0)<<2);c[n>>2]=(c[n>>2]|0)+(0-(c[l>>2]|0)<<2);b:do{if((c[l>>2]|0)!=1){do{if((c[l>>2]|0)!=2){v=c[k>>2]|0;u=(c[n>>2]|0)+(0-(c[l>>2]|0)<<2)|0;if((c[l>>2]|0)>=50){c[m>>2]=lg(v,u,(c[p>>2]|0)+(0-(c[l>>2]|0)<<2)|0,c[l>>2]|0,c[s>>2]|0,c[q>>2]|0)|0;break}else{c[m>>2]=jg(v,u,c[l>>2]<<1,(c[p>>2]|0)+(0-(c[l>>2]|0)<<2)|0,c[l>>2]|0,c[c[s>>2]>>2]|0)|0;break}}else{c[m>>2]=Be(c[k>>2]|0,0,(c[n>>2]|0)+ -8|0,4,(c[p>>2]|0)+ -8|0)|0}}while(0);if((c[l>>2]|0)!=(c[h>>2]|0)){u=c[q>>2]|0;if((c[l>>2]|0)>((c[h>>2]|0)-(c[l>>2]|0)|0)){De(u,c[k>>2]|0,c[l>>2]|0,(c[p>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[h>>2]|0)-(c[l>>2]|0)|0)|0}else{De(u,(c[p>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[h>>2]|0)-(c[l>>2]|0)|0,c[k>>2]|0,c[l>>2]|0)|0}c[o>>2]=te((c[n>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[n>>2]|0)+(0-(c[h>>2]|0)<<2)|0,c[q>>2]|0,c[h>>2]|0)|0;if((c[m>>2]|0)!=0){a=te((c[n>>2]|0)+(0-(c[h>>2]|0)<<2)+(c[l>>2]<<2)|0,(c[n>>2]|0)+(0-(c[h>>2]|0)<<2)+(c[l>>2]<<2)|0,(c[p>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[h>>2]|0)-(c[l>>2]|0)|0)|0;c[o>>2]=(c[o>>2]|0)+a}while(1){if((c[o>>2]|0)==0){break b}a=se(c[k>>2]|0,c[k>>2]|0,c[l>>2]|0,1)|0;c[m>>2]=(c[m>>2]|0)-a;a=qe((c[n>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[n>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[p>>2]|0)+(0-(c[h>>2]|0)<<2)|0,c[h>>2]|0)|0;c[o>>2]=(c[o>>2]|0)-a}}}else{c[m>>2]=(ff((c[n>>2]|0)+(0-(c[h>>2]|0)<<2)+4|0,(c[p>>2]|0)+(0-(c[h>>2]|0)<<2)|0,c[h>>2]|0)|0)>=0;if((c[m>>2]|0)!=0){te((c[n>>2]|0)+(0-(c[h>>2]|0)<<2)+4|0,(c[n>>2]|0)+(0-(c[h>>2]|0)<<2)+4|0,(c[p>>2]|0)+(0-(c[h>>2]|0)<<2)|0,c[h>>2]|0)|0}c[P>>2]=c[c[n>>2]>>2];c[w>>2]=c[(c[n>>2]|0)+ -4>>2];c[z>>2]=c[(c[n>>2]|0)+ -8>>2];c[x>>2]=c[(c[p>>2]|0)+ -4>>2];c[B>>2]=c[(c[p>>2]|0)+ -8>>2];if((((c[P>>2]|0)==(c[x>>2]|0)|0)!=0|0)!=0?(c[w>>2]|0)==(c[B>>2]|0):0){c[v>>2]=-1;c[o>>2]=we((c[n>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[p>>2]|0)+(0-(c[h>>2]|0)<<2)|0,c[h>>2]|0,c[v>>2]|0)|0}else{c[Y>>2]=c[P>>2];c[Z>>2]=c[c[s>>2]>>2];c[_>>2]=c[Y>>2]&65535;c[$>>2]=(c[Y>>2]|0)>>>16;c[aa>>2]=c[Z>>2]&65535;c[ba>>2]=(c[Z>>2]|0)>>>16;c[N>>2]=ea(c[_>>2]|0,c[aa>>2]|0)|0;c[M>>2]=ea(c[_>>2]|0,c[ba>>2]|0)|0;c[ca>>2]=ea(c[$>>2]|0,c[aa>>2]|0)|0;c[u>>2]=ea(c[$>>2]|0,c[ba>>2]|0)|0;c[M>>2]=(c[M>>2]|0)+((c[N>>2]|0)>>>16);c[M>>2]=(c[M>>2]|0)+(c[ca>>2]|0);if((c[M>>2]|0)>>>0<(c[ca>>2]|0)>>>0){c[u>>2]=(c[u>>2]|0)+65536}c[v>>2]=(c[u>>2]|0)+((c[M>>2]|0)>>>16);c[J>>2]=(c[M>>2]<<16)+(c[N>>2]&65535);c[O>>2]=(c[J>>2]|0)+(c[w>>2]|0);c[v>>2]=(c[v>>2]|0)+(c[P>>2]|0)+((c[O>>2]|0)>>>0<(c[J>>2]|0)>>>0);c[J>>2]=c[O>>2];c[w>>2]=(c[w>>2]|0)-(ea(c[x>>2]|0,c[v>>2]|0)|0);c[Q>>2]=(c[z>>2]|0)-(c[B>>2]|0);c[w>>2]=(c[w>>2]|0)-(c[x>>2]|0)-((c[z>>2]|0)>>>0<(c[B>>2]|0)>>>0);c[z>>2]=c[Q>>2];c[R>>2]=c[B>>2];c[S>>2]=c[v>>2];c[T>>2]=c[R>>2]&65535;c[U>>2]=(c[R>>2]|0)>>>16;c[V>>2]=c[S>>2]&65535;c[W>>2]=(c[S>>2]|0)>>>16;c[G>>2]=ea(c[T>>2]|0,c[V>>2]|0)|0;c[E>>2]=ea(c[T>>2]|0,c[W>>2]|0)|0;c[X>>2]=ea(c[U>>2]|0,c[V>>2]|0)|0;c[D>>2]=ea(c[U>>2]|0,c[W>>2]|0)|0;c[E>>2]=(c[E>>2]|0)+((c[G>>2]|0)>>>16);c[E>>2]=(c[E>>2]|0)+(c[X>>2]|0);if((c[E>>2]|0)>>>0<(c[X>>2]|0)>>>0){c[D>>2]=(c[D>>2]|0)+65536}c[F>>2]=(c[D>>2]|0)+((c[E>>2]|0)>>>16);c[H>>2]=(c[E>>2]<<16)+(c[G>>2]&65535);c[I>>2]=(c[z>>2]|0)-(c[H>>2]|0);c[w>>2]=(c[w>>2]|0)-(c[F>>2]|0)-((c[z>>2]|0)>>>0<(c[H>>2]|0)>>>0);c[z>>2]=c[I>>2];c[v>>2]=(c[v>>2]|0)+1;c[K>>2]=0-((c[w>>2]|0)>>>0>=(c[J>>2]|0)>>>0);c[v>>2]=(c[v>>2]|0)+(c[K>>2]|0);c[L>>2]=(c[z>>2]|0)+(c[K>>2]&c[B>>2]);c[w>>2]=(c[w>>2]|0)+(c[K>>2]&c[x>>2])+((c[L>>2]|0)>>>0<(c[z>>2]|0)>>>0);c[z>>2]=c[L>>2];do{if((((c[w>>2]|0)>>>0>=(c[x>>2]|0)>>>0|0)!=0|0)!=0){if(!((c[w>>2]|0)>>>0>(c[x>>2]|0)>>>0)?!((c[z>>2]|0)>>>0>=(c[B>>2]|0)>>>0):0){break}c[v>>2]=(c[v>>2]|0)+1;c[C>>2]=(c[z>>2]|0)-(c[B>>2]|0);c[w>>2]=(c[w>>2]|0)-(c[x>>2]|0)-((c[z>>2]|0)>>>0<(c[B>>2]|0)>>>0);c[z>>2]=c[C>>2]}}while(0);if((c[h>>2]|0)>2){c[y>>2]=we((c[n>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[p>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[h>>2]|0)-2|0,c[v>>2]|0)|0;c[A>>2]=(c[z>>2]|0)>>>0<(c[y>>2]|0)>>>0;c[z>>2]=(c[z>>2]|0)-(c[y>>2]|0);c[y>>2]=(c[w>>2]|0)>>>0<(c[A>>2]|0)>>>0;c[w>>2]=(c[w>>2]|0)-(c[A>>2]|0);c[(c[n>>2]|0)+ -8>>2]=c[z>>2];if((((c[y>>2]|0)!=0|0)!=0|0)!=0){a=c[x>>2]|0;a=a+(qe((c[n>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[n>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[p>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[h>>2]|0)-1|0)|0)|0;c[w>>2]=(c[w>>2]|0)+a;c[m>>2]=(c[m>>2]|0)-((c[v>>2]|0)==0);c[v>>2]=(c[v>>2]|0)-1}}else{c[(c[n>>2]|0)+ -8>>2]=c[z>>2]}c[(c[n>>2]|0)+ -4>>2]=c[w>>2]}c[c[k>>2]>>2]=c[v>>2]}}while(0);c[l>>2]=(c[t>>2]|0)-(c[h>>2]|0)-(c[l>>2]|0);do{c[k>>2]=(c[k>>2]|0)+(0-(c[h>>2]|0)<<2);c[n>>2]=(c[n>>2]|0)+(0-(c[h>>2]|0)<<2);lg(c[k>>2]|0,(c[n>>2]|0)+(0-(c[h>>2]|0)<<2)|0,(c[p>>2]|0)+(0-(c[h>>2]|0)<<2)|0,c[h>>2]|0,c[s>>2]|0,c[q>>2]|0)|0;c[l>>2]=(c[l>>2]|0)-(c[h>>2]|0)}while((c[l>>2]|0)>0)}}while(0);if((((c[j>>2]|0)!=0|0)!=0|0)==0){a=c[m>>2]|0;i=r;return a|0}Od(c[j>>2]|0);a=c[m>>2]|0;i=r;return a|0}function ng(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;s=i;i=i+48|0;t=s+36|0;r=s+32|0;p=s+28|0;j=s+24|0;n=s+20|0;m=s+16|0;l=s+12|0;k=s+8|0;q=s+4|0;o=s;c[t>>2]=a;c[r>>2]=b;c[p>>2]=d;c[j>>2]=e;c[n>>2]=f;c[m>>2]=g;c[l>>2]=h;c[k>>2]=(c[j>>2]|0)-(c[m>>2]|0);g=c[t>>2]|0;h=c[r>>2]|0;if(((c[k>>2]|0)+100|0)>=(c[m>>2]|0)){c[o>>2]=og(g,h,c[p>>2]|0,c[j>>2]|0,c[n>>2]|0,c[m>>2]|0,c[l>>2]|0)|0;a=c[o>>2]|0;i=s;return a|0}c[o>>2]=og(g,h+(c[j>>2]<<2)+(0-((c[k>>2]<<1)+1)<<2)|0,(c[p>>2]|0)+(c[j>>2]<<2)+(0-((c[k>>2]<<1)+1)<<2)|0,(c[k>>2]<<1)+1|0,(c[n>>2]|0)+(c[m>>2]<<2)+(0-((c[k>>2]|0)+1)<<2)|0,(c[k>>2]|0)+1|0,c[l>>2]|0)|0;h=c[l>>2]|0;if(((c[m>>2]|0)-((c[k>>2]|0)+1)|0)>(c[k>>2]|0)){De(h,c[n>>2]|0,(c[m>>2]|0)-((c[k>>2]|0)+1)|0,c[t>>2]|0,c[k>>2]|0)|0}else{De(h,c[t>>2]|0,c[k>>2]|0,c[n>>2]|0,(c[m>>2]|0)-((c[k>>2]|0)+1)|0)|0}if((c[o>>2]|0)!=0){c[q>>2]=qe((c[l>>2]|0)+(c[k>>2]<<2)|0,(c[l>>2]|0)+(c[k>>2]<<2)|0,c[n>>2]|0,(c[m>>2]|0)-((c[k>>2]|0)+1)|0)|0}else{c[q>>2]=0}c[(c[l>>2]|0)+((c[m>>2]|0)-1<<2)>>2]=c[q>>2];c[q>>2]=te(c[r>>2]|0,c[p>>2]|0,c[l>>2]|0,(c[j>>2]|0)-((c[k>>2]<<1)+1)|0)|0;c[q>>2]=pg((c[r>>2]|0)+(c[j>>2]<<2)+(0-((c[k>>2]<<1)+1)<<2)|0,(c[r>>2]|0)+(c[j>>2]<<2)+(0-((c[k>>2]<<1)+1)<<2)|0,(c[l>>2]|0)+(c[j>>2]<<2)+(0-((c[k>>2]<<1)+1)<<2)|0,(c[k>>2]|0)+1|0,c[q>>2]|0)|0;if((c[q>>2]|0)==0){a=c[o>>2]|0;i=s;return a|0}a=se(c[t>>2]|0,c[t>>2]|0,c[k>>2]|0,1)|0;c[o>>2]=(c[o>>2]|0)-a;qe(c[r>>2]|0,c[r>>2]|0,c[n>>2]|0,c[m>>2]|0)|0;a=c[o>>2]|0;i=s;return a|0}function og(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;x=i;i=i+112|0;p=x+104|0;q=x+100|0;r=x+96|0;s=x+92|0;t=x+88|0;u=x+84|0;v=x+80|0;K=x+76|0;z=x+72|0;J=x+68|0;w=x+64|0;l=x+60|0;y=x+56|0;C=x+52|0;A=x+48|0;B=x+44|0;j=x+40|0;k=x+36|0;m=x+32|0;n=x+28|0;o=x+24|0;D=x+20|0;E=x+16|0;F=x+12|0;G=x+8|0;H=x+4|0;I=x;c[p>>2]=a;c[q>>2]=b;c[r>>2]=d;c[s>>2]=e;c[t>>2]=f;c[u>>2]=g;c[v>>2]=h;c[K>>2]=(c[s>>2]|0)-(c[u>>2]|0);c[z>>2]=rg(c[K>>2]|0,c[u>>2]|0,0)|0;c[l>>2]=c[v>>2];c[y>>2]=(c[v>>2]|0)+(c[z>>2]<<2)+4;a:do{if((c[u>>2]|0)==(c[z>>2]|0)){if((c[z>>2]|0)!=0){c[C>>2]=(c[z>>2]|0)-1;c[A>>2]=(c[y>>2]|0)+4;c[B>>2]=c[t>>2];K=c[B>>2]|0;c[B>>2]=K+4;c[j>>2]=c[K>>2];if((c[C>>2]|0)!=0){do{a=c[j>>2]|0;K=c[A>>2]|0;c[A>>2]=K+4;c[K>>2]=a;K=c[B>>2]|0;c[B>>2]=K+4;c[j>>2]=c[K>>2];K=(c[C>>2]|0)+ -1|0;c[C>>2]=K}while((K|0)!=0)}a=c[j>>2]|0;K=c[A>>2]|0;c[A>>2]=K+4;c[K>>2]=a}c[c[y>>2]>>2]=1;_f(c[l>>2]|0,c[y>>2]|0,(c[z>>2]|0)+1|0,0)|0;if((c[z>>2]|0)!=0){c[k>>2]=(c[z>>2]|0)-1;c[m>>2]=c[l>>2];c[n>>2]=(c[l>>2]|0)+4;K=c[n>>2]|0;c[n>>2]=K+4;c[o>>2]=c[K>>2];if((c[k>>2]|0)!=0){do{a=c[o>>2]|0;K=c[m>>2]|0;c[m>>2]=K+4;c[K>>2]=a;K=c[n>>2]|0;c[n>>2]=K+4;c[o>>2]=c[K>>2];K=(c[k>>2]|0)+ -1|0;c[k>>2]=K}while((K|0)!=0)}a=c[o>>2]|0;K=c[m>>2]|0;c[m>>2]=K+4;c[K>>2]=a}}else{c[J>>2]=pe(c[y>>2]|0,(c[t>>2]|0)+(c[u>>2]<<2)+(0-((c[z>>2]|0)+1)<<2)|0,(c[z>>2]|0)+1|0,1)|0;if((((c[J>>2]|0)!=0|0)!=0|0)!=0){if((c[z>>2]|0)==0){break}c[D>>2]=c[l>>2];c[E>>2]=c[z>>2];while(1){K=c[D>>2]|0;c[D>>2]=K+4;c[K>>2]=0;K=(c[E>>2]|0)+ -1|0;c[E>>2]=K;if((K|0)==0){break a}}}_f(c[l>>2]|0,c[y>>2]|0,(c[z>>2]|0)+1|0,0)|0;if((c[z>>2]|0)!=0){c[F>>2]=(c[z>>2]|0)-1;c[G>>2]=c[l>>2];c[H>>2]=(c[l>>2]|0)+4;K=c[H>>2]|0;c[H>>2]=K+4;c[I>>2]=c[K>>2];if((c[F>>2]|0)!=0){do{a=c[I>>2]|0;K=c[G>>2]|0;c[G>>2]=K+4;c[K>>2]=a;K=c[H>>2]|0;c[H>>2]=K+4;c[I>>2]=c[K>>2];K=(c[F>>2]|0)+ -1|0;c[F>>2]=K}while((K|0)!=0)}a=c[I>>2]|0;K=c[G>>2]|0;c[G>>2]=K+4;c[K>>2]=a}}}while(0);c[w>>2]=qg(c[p>>2]|0,c[q>>2]|0,c[r>>2]|0,c[s>>2]|0,c[t>>2]|0,c[u>>2]|0,c[l>>2]|0,c[z>>2]|0,(c[v>>2]|0)+(c[z>>2]<<2)|0)|0;i=x;return c[w>>2]|0}function pg(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+32|0;l=h+20|0;n=h+16|0;m=h+12|0;k=h+8|0;j=h+4|0;g=h;c[l>>2]=a;c[n>>2]=b;c[m>>2]=d;c[k>>2]=e;c[j>>2]=f;c[g>>2]=te(c[l>>2]|0,c[n>>2]|0,c[m>>2]|0,c[k>>2]|0)|0;a=se(c[l>>2]|0,c[l>>2]|0,c[k>>2]|0,c[j>>2]|0)|0;c[g>>2]=(c[g>>2]|0)+a;i=h;return c[g>>2]|0}function qg(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;m=i;i=i+128|0;l=m+112|0;F=m+108|0;r=m+104|0;w=m+100|0;O=m+96|0;B=m+92|0;p=m+88|0;I=m+84|0;x=m+80|0;t=m+76|0;H=m+72|0;y=m+68|0;C=m+64|0;n=m+60|0;z=m+56|0;E=m+52|0;o=m+48|0;M=m+44|0;K=m+40|0;L=m+36|0;J=m+32|0;D=m+28|0;A=m+24|0;q=m+20|0;s=m+16|0;u=m+12|0;v=m+8|0;G=m+4|0;N=m;c[F>>2]=a;c[r>>2]=b;c[w>>2]=d;c[O>>2]=e;c[B>>2]=f;c[p>>2]=g;c[I>>2]=h;c[x>>2]=j;c[t>>2]=k;c[H>>2]=(c[O>>2]|0)-(c[p>>2]|0);c[w>>2]=(c[w>>2]|0)+(c[H>>2]<<2);c[F>>2]=(c[F>>2]|0)+(c[H>>2]<<2);c[n>>2]=(ff(c[w>>2]|0,c[B>>2]|0,c[p>>2]|0)|0)>=0;if((c[n>>2]|0)==0){if((c[p>>2]|0)!=0){c[M>>2]=(c[p>>2]|0)-1;c[K>>2]=c[r>>2];c[L>>2]=c[w>>2];O=c[L>>2]|0;c[L>>2]=O+4;c[J>>2]=c[O>>2];if((c[M>>2]|0)!=0){do{a=c[J>>2]|0;O=c[K>>2]|0;c[K>>2]=O+4;c[O>>2]=a;O=c[L>>2]|0;c[L>>2]=O+4;c[J>>2]=c[O>>2];O=(c[M>>2]|0)+ -1|0;c[M>>2]=O}while((O|0)!=0)}a=c[J>>2]|0;O=c[K>>2]|0;c[K>>2]=O+4;c[O>>2]=a}}else{te(c[r>>2]|0,c[w>>2]|0,c[B>>2]|0,c[p>>2]|0)|0}if((c[H>>2]|0)==0){c[l>>2]=c[n>>2];O=c[l>>2]|0;i=m;return O|0}while(1){if((c[H>>2]|0)<=0){o=36;break}if((c[H>>2]|0)<(c[x>>2]|0)){c[I>>2]=(c[I>>2]|0)+((c[x>>2]|0)-(c[H>>2]|0)<<2);c[x>>2]=c[H>>2]}c[w>>2]=(c[w>>2]|0)+(0-(c[x>>2]|0)<<2);c[F>>2]=(c[F>>2]|0)+(0-(c[x>>2]|0)<<2);We(c[t>>2]|0,(c[r>>2]|0)+(c[p>>2]<<2)+(0-(c[x>>2]|0)<<2)|0,c[I>>2]|0,c[x>>2]|0);c[y>>2]=qe(c[F>>2]|0,(c[t>>2]|0)+(c[x>>2]<<2)|0,(c[r>>2]|0)+(c[p>>2]<<2)+(0-(c[x>>2]|0)<<2)|0,c[x>>2]|0)|0;if(((((c[y>>2]|0)==0^1)&1|0)!=0|0)!=0){o=13;break}c[H>>2]=(c[H>>2]|0)-(c[x>>2]|0);if((c[x>>2]|0)>=40){c[E>>2]=dg((c[p>>2]|0)+1|0)|0;ag(c[t>>2]|0,c[E>>2]|0,c[B>>2]|0,c[p>>2]|0,c[F>>2]|0,c[x>>2]|0,(c[t>>2]|0)+(c[E>>2]<<2)|0);c[o>>2]=(c[p>>2]|0)+(c[x>>2]|0)-(c[E>>2]|0);if((c[o>>2]|0)>0){c[y>>2]=te(c[t>>2]|0,c[t>>2]|0,(c[r>>2]|0)+(c[p>>2]<<2)+(0-(c[o>>2]|0)<<2)|0,c[o>>2]|0)|0;c[y>>2]=se((c[t>>2]|0)+(c[o>>2]<<2)|0,(c[t>>2]|0)+(c[o>>2]<<2)|0,(c[E>>2]|0)-(c[o>>2]|0)|0,c[y>>2]|0)|0;c[C>>2]=(ff((c[r>>2]|0)+(c[p>>2]<<2)+(0-(c[x>>2]|0)<<2)|0,(c[t>>2]|0)+(c[p>>2]<<2)|0,(c[E>>2]|0)-(c[p>>2]|0)|0)|0)<0;if(((((c[C>>2]|0)>>>0>=(c[y>>2]|0)>>>0^1)&1|0)!=0|0)!=0){o=18;break}c[A>>2]=c[t>>2];c[D>>2]=(c[c[A>>2]>>2]|0)+((c[C>>2]|0)-(c[y>>2]|0));c[c[A>>2]>>2]=c[D>>2];if((c[D>>2]|0)>>>0<((c[C>>2]|0)-(c[y>>2]|0)|0)>>>0){do{a=(c[A>>2]|0)+4|0;c[A>>2]=a;O=(c[a>>2]|0)+1|0;c[a>>2]=O}while((O|0)==0)}}}else{De(c[t>>2]|0,c[B>>2]|0,c[p>>2]|0,c[F>>2]|0,c[x>>2]|0)|0}c[z>>2]=(c[(c[r>>2]|0)+((c[p>>2]|0)-(c[x>>2]|0)<<2)>>2]|0)-(c[(c[t>>2]|0)+(c[p>>2]<<2)>>2]|0);if((c[p>>2]|0)!=(c[x>>2]|0)){c[y>>2]=te(c[t>>2]|0,c[w>>2]|0,c[t>>2]|0,c[x>>2]|0)|0;c[y>>2]=pg((c[t>>2]|0)+(c[x>>2]<<2)|0,c[r>>2]|0,(c[t>>2]|0)+(c[x>>2]<<2)|0,(c[p>>2]|0)-(c[x>>2]|0)|0,c[y>>2]|0)|0;if((c[p>>2]|0)!=0){c[q>>2]=(c[p>>2]|0)-1;c[s>>2]=c[r>>2];c[u>>2]=c[t>>2];O=c[u>>2]|0;c[u>>2]=O+4;c[v>>2]=c[O>>2];if((c[q>>2]|0)!=0){do{a=c[v>>2]|0;O=c[s>>2]|0;c[s>>2]=O+4;c[O>>2]=a;O=c[u>>2]|0;c[u>>2]=O+4;c[v>>2]=c[O>>2];O=(c[q>>2]|0)+ -1|0;c[q>>2]=O}while((O|0)!=0)}a=c[v>>2]|0;O=c[s>>2]|0;c[s>>2]=O+4;c[O>>2]=a}}else{c[y>>2]=te(c[r>>2]|0,c[w>>2]|0,c[t>>2]|0,c[x>>2]|0)|0}c[z>>2]=(c[z>>2]|0)-(c[y>>2]|0);while(1){if((c[z>>2]|0)==0){break}c[G>>2]=c[F>>2];do{a=c[G>>2]|0;c[G>>2]=a+4;O=(c[a>>2]|0)+1|0;c[a>>2]=O}while((O|0)==0);c[y>>2]=te(c[r>>2]|0,c[r>>2]|0,c[B>>2]|0,c[p>>2]|0)|0;c[z>>2]=(c[z>>2]|0)-(c[y>>2]|0)}if((ff(c[r>>2]|0,c[B>>2]|0,c[p>>2]|0)|0)<0){continue}c[N>>2]=c[F>>2];do{a=c[N>>2]|0;c[N>>2]=a+4;O=(c[a>>2]|0)+1|0;c[a>>2]=O}while((O|0)==0);c[y>>2]=te(c[r>>2]|0,c[r>>2]|0,c[B>>2]|0,c[p>>2]|0)|0}if((o|0)==13){Hd(13976,280,14032)}else if((o|0)==18){Hd(13976,300,14040)}else if((o|0)==36){c[l>>2]=c[n>>2];O=c[l>>2]|0;i=m;return O|0}return 0}function rg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+32|0;h=f+20|0;g=f+16|0;l=f+12|0;e=f+8|0;j=f+4|0;k=f;c[h>>2]=a;c[g>>2]=b;c[l>>2]=d;if((c[l>>2]|0)!=0){c[k>>2]=(c[g>>2]|0)<(c[h>>2]|0)?c[g>>2]|0:c[h>>2]|0;c[e>>2]=(((c[k>>2]|0)-1|0)/(c[l>>2]|0)|0)+1;a=c[e>>2]|0;i=f;return a|0}d=c[h>>2]|0;if((c[h>>2]|0)>(c[g>>2]|0)){c[j>>2]=((d-1|0)/(c[g>>2]|0)|0)+1;c[e>>2]=(((c[h>>2]|0)-1|0)/(c[j>>2]|0)|0)+1;a=c[e>>2]|0;i=f;return a|0}h=(c[h>>2]|0)-1|0;if((d*3|0)>(c[g>>2]|0)){c[e>>2]=((h|0)/2|0)+1;a=c[e>>2]|0;i=f;return a|0}else{c[e>>2]=((h|0)/1|0)+1;a=c[e>>2]|0;i=f;return a|0}return 0}function sg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;h=i;i=i+32|0;l=h+20|0;j=h+16|0;k=h+12|0;f=h+8|0;g=h+4|0;e=h;c[l>>2]=a;c[j>>2]=b;c[k>>2]=d;c[f>>2]=dg((c[j>>2]|0)+1|0)|0;c[g>>2]=rg((c[l>>2]|0)-(c[j>>2]|0)|0,c[j>>2]|0,c[k>>2]|0)|0;c[e>>2]=tg(c[f>>2]|0,c[j>>2]|0,c[g>>2]|0)|0;i=h;return(c[g>>2]|0)+(c[f>>2]|0)+(c[e>>2]|0)|0}function tg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+32|0;g=e+16|0;k=e+12|0;j=e+8|0;h=e+4|0;f=e;c[g>>2]=a;c[k>>2]=b;c[j>>2]=d;c[h>>2]=c[g>>2]>>1;d=(c[g>>2]|0)+4|0;if((c[k>>2]|0)<=(c[h>>2]|0)){k=0;k=d+k|0;c[f>>2]=k;k=c[f>>2]|0;i=e;return k|0}k=(c[j>>2]|0)>(c[h>>2]|0)?c[g>>2]|0:c[h>>2]|0;k=d+k|0;c[f>>2]=k;k=c[f>>2]|0;i=e;return k|0}function ug(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;t=i;i=i+80|0;B=t+76|0;j=t+72|0;x=t+68|0;n=t+64|0;h=t+60|0;l=t+56|0;z=t+52|0;y=t+48|0;A=t+44|0;k=t+40|0;g=t+36|0;u=t+32|0;v=t+28|0;w=t+24|0;p=t+20|0;r=t+16|0;q=t+12|0;s=t+8|0;m=t+4|0;o=t;c[B>>2]=a;c[j>>2]=b;c[x>>2]=d;c[n>>2]=e;c[h>>2]=f;c[k>>2]=0;while(1){if((c[k>>2]|0)>=(c[x>>2]|0)){break}c[l>>2]=c[(c[j>>2]|0)+(c[k>>2]<<2)>>2];c[m>>2]=c[l>>2];c[o>>2]=c[n>>2]<<0;c[p>>2]=c[m>>2]&65535;c[q>>2]=(c[m>>2]|0)>>>16;c[r>>2]=c[o>>2]&65535;c[s>>2]=(c[o>>2]|0)>>>16;c[g>>2]=ea(c[p>>2]|0,c[r>>2]|0)|0;c[u>>2]=ea(c[p>>2]|0,c[s>>2]|0)|0;c[v>>2]=ea(c[q>>2]|0,c[r>>2]|0)|0;c[w>>2]=ea(c[q>>2]|0,c[s>>2]|0)|0;c[u>>2]=(c[u>>2]|0)+((c[g>>2]|0)>>>16);c[u>>2]=(c[u>>2]|0)+(c[v>>2]|0);if((c[u>>2]|0)>>>0<(c[v>>2]|0)>>>0){c[w>>2]=(c[w>>2]|0)+65536}c[y>>2]=(c[w>>2]|0)+((c[u>>2]|0)>>>16);c[z>>2]=(c[u>>2]<<16)+(c[g>>2]&65535);c[z>>2]=(c[z>>2]|0)>>>0;c[A>>2]=(c[h>>2]|0)>>>0<(c[z>>2]|0)>>>0;c[h>>2]=(c[h>>2]|0)-(c[z>>2]|0);c[(c[B>>2]|0)+(c[k>>2]<<2)>>2]=c[h>>2];c[h>>2]=(c[h>>2]|0)-(c[y>>2]|0)-(c[A>>2]|0);c[k>>2]=(c[k>>2]|0)+1}i=t;return c[h>>2]|0}function vg(b){b=b|0;var d=0,e=0,f=0,g=0;e=i;c[b+16>>2]=0;c[b+20>>2]=0;c[b+24>>2]=0;c[b+32>>2]=0;c[b+36>>2]=0;c[b+28>>2]=b+32;c[b+44>>2]=0;c[b+48>>2]=0;c[b+40>>2]=b+44;f=b+52|0;d=f+84|0;do{c[f>>2]=0;f=f+4|0}while((f|0)<(d|0));c[b+152>>2]=0;c[b+156>>2]=0;c[b+160>>2]=0;c[b+168>>2]=0;c[b+172>>2]=0;c[b+164>>2]=b+168;c[b+180>>2]=0;c[b+184>>2]=0;c[b+176>>2]=b+180;g=b+284|0;f=b+188|0;d=f+96|0;do{c[f>>2]=0;f=f+4|0}while((f|0)<(d|0));c[g>>2]=2;Yd(b+296|0);Yd(b+308|0);c[g>>2]=2;a[b+320|0]=0;a[b+321|0]=0;i=e;return}function wg(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=i;i=i+272|0;o=h+136|0;j=h;l=o+32|0;p=o+28|0;n=o+0|0;m=n+52|0;do{c[n>>2]=0;n=n+4|0}while((n|0)<(m|0));c[p>>2]=l;c[o+44>>2]=0;c[o+48>>2]=0;c[o+40>>2]=o+44;n=o+52|0;m=n+84|0;do{c[n>>2]=0;n=n+4|0}while((n|0)<(m|0));xg(b,o)|0;xd(o);Ng(b,d,e)|0;l=b+296|0;Ug(b,l)|0;c[b+288>>2]=ie(l,2)|0;n=a[d]|0;m=(n&1)==0;if(m){n=(n&255)>>>1}else{n=c[d+4>>2]|0}p=a[f]|0;o=(p&1)==0;if(o){p=(p&255)>>>1}else{p=c[f+4>>2]|0}a:do{if((n|0)==(p|0)){if(m){p=d+1|0}else{p=c[d+8>>2]|0}if(o){d=f+1|0}else{d=c[f+8>>2]|0}if(m){if((n|0)==0){d=1}else{while(1){if((a[p]|0)!=(a[d]|0)){k=19;break a}n=n+ -1|0;if((n|0)==0){d=1;break}else{p=p+1|0;d=d+1|0}}}}else{d=(yr(p,d,n)|0)==0}m=b+136|0;if(d&(e|0)==(g|0)){yg(m,b)|0;e=m}else{e=m;k=22}}else{k=19}}while(0);if((k|0)==19){e=b+136|0;k=22}if((k|0)==22){k=j+32|0;d=j+28|0;n=j+0|0;m=n+52|0;do{c[n>>2]=0;n=n+4|0}while((n|0)<(m|0));c[d>>2]=k;c[j+44>>2]=0;c[j+48>>2]=0;c[j+40>>2]=j+44;n=j+52|0;m=n+84|0;do{c[n>>2]=0;n=n+4|0}while((n|0)<(m|0));xg(e,j)|0;xd(j);Ng(e,f,g)|0}p=b+308|0;Ug(e,p)|0;c[b+292>>2]=ie(p,2)|0;if((Vd(p,l)|0)<0){p=0;i=h;return p|0}a[b+321|0]=1;p=1;i=h;return p|0}function xg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+16|0;g=e+1|0;f=e;c[b>>2]=c[d>>2];c[b+4>>2]=c[d+4>>2];c[b+8>>2]=c[d+8>>2];c[b+12>>2]=c[d+12>>2];h=b+16|0;k=c[h>>2]|0;j=b+20|0;if((k|0)==0){k=b+24|0}else{l=c[j>>2]|0;if((l|0)!=(k|0)){c[j>>2]=l+(~((l+ -4+(0-k)|0)>>>2)<<2)}jr(k);k=b+24|0;c[k>>2]=0;c[j>>2]=0;c[h>>2]=0}l=d+16|0;c[h>>2]=c[l>>2];m=d+20|0;c[j>>2]=c[m>>2];j=d+24|0;c[k>>2]=c[j>>2];c[j>>2]=0;c[m>>2]=0;c[l>>2]=0;k=b+28|0;j=b+32|0;yd(k,c[j>>2]|0);l=d+28|0;c[k>>2]=c[l>>2];m=c[d+32>>2]|0;c[b+32>>2]=m;h=d+36|0;n=c[h>>2]|0;c[b+36>>2]=n;if((n|0)==0){c[k>>2]=j}else{c[m+8>>2]=j;n=d+32|0;c[l>>2]=n;c[n>>2]=0;c[h>>2]=0}l=b+40|0;m=b+44|0;zd(l,c[m>>2]|0);j=d+40|0;c[l>>2]=c[j>>2];k=c[d+44>>2]|0;c[b+44>>2]=k;h=d+48|0;n=c[h>>2]|0;c[b+48>>2]=n;if((n|0)==0){c[l>>2]=m}else{c[k+8>>2]=m;n=d+44|0;c[j>>2]=n;c[n>>2]=0;c[h>>2]=0}j=b+52|0;k=c[j>>2]|0;h=b+56|0;if((k|0)==0){k=b+60|0}else{l=c[h>>2]|0;if((l|0)!=(k|0)){c[h>>2]=l+(~((l+ -4+(0-k)|0)>>>2)<<2)}jr(k);k=b+60|0;c[k>>2]=0;c[h>>2]=0;c[j>>2]=0}n=d+52|0;c[j>>2]=c[n>>2];j=d+56|0;c[h>>2]=c[j>>2];h=d+60|0;c[k>>2]=c[h>>2];c[h>>2]=0;c[j>>2]=0;c[n>>2]=0;j=b+64|0;k=c[j>>2]|0;h=b+68|0;if((k|0)==0){k=b+72|0}else{m=c[h>>2]|0;if((m|0)!=(k|0)){do{n=m+ -12|0;c[h>>2]=n;l=c[n>>2]|0;if((l|0)==0){m=n}else{m=m+ -8|0;n=c[m>>2]|0;if((n|0)!=(l|0)){c[m>>2]=n+(~((n+ -4+(0-l)|0)>>>2)<<2)}jr(l);m=c[h>>2]|0}}while((m|0)!=(k|0));k=c[j>>2]|0}jr(k);k=b+72|0;c[k>>2]=0;c[h>>2]=0;c[j>>2]=0}n=d+64|0;c[j>>2]=c[n>>2];j=d+68|0;c[h>>2]=c[j>>2];h=d+72|0;c[k>>2]=c[h>>2];c[h>>2]=0;c[j>>2]=0;c[n>>2]=0;h=b+76|0;j=c[h>>2]|0;if((j|0)==0){j=b+80|0;k=b+84|0}else{k=b+84|0;jr(j);c[h>>2]=0;c[k>>2]=0;j=b+80|0;c[j>>2]=0}n=d+76|0;c[h>>2]=c[n>>2];l=d+80|0;c[j>>2]=c[l>>2];h=d+84|0;c[k>>2]=c[h>>2];c[n>>2]=0;c[l>>2]=0;c[h>>2]=0;h=b+88|0;l=c[h>>2]|0;j=b+92|0;if((l|0)==0){k=b+96|0}else{k=c[j>>2]|0;if((k|0)!=(l|0)){c[j>>2]=k+(~((k+ -4+(0-l)|0)>>>2)<<2)}jr(l);k=b+96|0;c[k>>2]=0;c[j>>2]=0;c[h>>2]=0}n=d+88|0;c[h>>2]=c[n>>2];h=d+92|0;c[j>>2]=c[h>>2];m=d+96|0;c[k>>2]=c[m>>2];c[m>>2]=0;c[h>>2]=0;c[n>>2]=0;n=b+100|0;h=d+100|0;a[g+0|0]=a[f+0|0]|0;Mg(n,h,g);f=b+112|0;h=c[f>>2]|0;g=b+116|0;if((h|0)==0){h=b+120|0}else{while(1){j=c[g>>2]|0;if((j|0)==(h|0)){break}n=j+ -12|0;c[g>>2]=n;Ud(n)}jr(c[f>>2]|0);h=b+120|0;c[h>>2]=0;c[g>>2]=0;c[f>>2]=0}j=d+112|0;c[f>>2]=c[j>>2];n=d+116|0;c[g>>2]=c[n>>2];g=d+120|0;c[h>>2]=c[g>>2];c[g>>2]=0;c[n>>2]=0;c[j>>2]=0;h=b+124|0;j=c[h>>2]|0;g=b+128|0;if((j|0)==0){k=b+132|0;n=d+124|0;m=c[n>>2]|0;c[h>>2]=m;m=d+128|0;l=c[m>>2]|0;c[g>>2]=l;l=d+132|0;j=c[l>>2]|0;c[k>>2]=j;c[l>>2]=0;c[m>>2]=0;c[n>>2]=0;i=e;return b|0}while(1){f=c[g>>2]|0;if((f|0)==(j|0)){break}n=f+ -12|0;c[g>>2]=n;Ud(n)}jr(c[h>>2]|0);k=b+132|0;c[k>>2]=0;c[g>>2]=0;c[h>>2]=0;n=d+124|0;m=c[n>>2]|0;c[h>>2]=m;m=d+128|0;l=c[m>>2]|0;c[g>>2]=l;l=d+132|0;j=c[l>>2]|0;c[k>>2]=j;c[l>>2]=0;c[m>>2]=0;c[n>>2]=0;i=e;return b|0}function yg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+32|0;h=d+20|0;g=d+16|0;e=d+12|0;f=d+8|0;l=d+4|0;k=d;c[a+0>>2]=c[b+0>>2];c[a+4>>2]=c[b+4>>2];c[a+8>>2]=c[b+8>>2];c[a+12>>2]=c[b+12>>2];j=(a|0)==(b|0);if(!j){Lg(a+16|0,c[b+16>>2]|0,c[b+20>>2]|0);m=a+28|0;c[l>>2]=c[b+28>>2];c[k>>2]=b+32;c[g+0>>2]=c[l+0>>2];c[h+0>>2]=c[k+0>>2];Kg(m,g,h)}if(j){Cg(a+76|0,b+76|0)|0;i=d;return a|0}else{m=a+40|0;c[e>>2]=c[b+40>>2];c[f>>2]=b+44;c[g+0>>2]=c[e+0>>2];c[h+0>>2]=c[f+0>>2];Ig(m,g,h);Lg(a+52|0,c[b+52>>2]|0,c[b+56>>2]|0);Gg(a+64|0,c[b+64>>2]|0,c[b+68>>2]|0);Cg(a+76|0,b+76|0)|0;Lg(a+88|0,c[b+88>>2]|0,c[b+92>>2]|0);Eg(a+100|0,c[b+100>>2]|0,c[b+104>>2]|0);Dg(a+112|0,c[b+112>>2]|0,c[b+116>>2]|0);Dg(a+124|0,c[b+124>>2]|0,c[b+128>>2]|0);i=d;return a|0}return 0}function zg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;m=a[d]|0;if((m&1)==0){g=(m&255)>>>1}else{g=c[d+4>>2]|0}if((g|0)!=32){m=0;i=f;return m|0}j=d+1|0;h=d+8|0;g=d+4|0;k=0;while(1){l=(m&1)==0;if(l){m=(m&255)>>>1}else{m=c[g>>2]|0}if(!(k>>>0<m>>>0)){break}if(l){l=j}else{l=c[h>>2]|0}if((Fb(a[l+k|0]|0)|0)==0){b=0;e=15;break}m=a[d]|0;k=k+1|0}if((e|0)==15){i=f;return b|0}Pi(b+272|0,d)|0;a[b+320|0]=1;m=1;i=f;return m|0}function Ag(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+32|0;h=f+12|0;g=f;if((a[b+320|0]|0)==0){l=0;i=f;return l|0}if((a[b+321|0]|0)==0){l=0;i=f;return l|0}Yd(h);Tg(b,d,h)|0;_d(g,0);j=b+284|0;k=b+272|0;l=b+292|0;qh(j,k,h,c[l>>2]|0,g)|0;d=b+308|0;while(1){if(!((Vd(g,d)|0)>-1)){break}qh(j,k,g,c[l>>2]|0,g)|0}Sg(b+136|0,g,e)|0;Ud(g);Ud(h);l=1;i=f;return l|0}function Bg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+32|0;h=f+12|0;g=f;if((a[b+320|0]|0)==0){l=0;i=f;return l|0}if((a[b+321|0]|0)==0){l=0;i=f;return l|0}Yd(h);Tg(b+136|0,d,h)|0;_d(g,0);j=b+284|0;k=b+272|0;l=b+292|0;rh(j,k,h,c[l>>2]|0,g)|0;d=b+296|0;while(1){if(!((Vd(g,d)|0)>-1)){break}rh(j,k,g,c[l>>2]|0,g)|0}Sg(b,g,e)|0;Ud(g);Ud(h);l=1;i=f;return l|0}function Cg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;if((a|0)==(b|0)){i=d;return a|0}g=b+4|0;j=c[g>>2]|0;if((j|0)==0){e=0}else{h=a+8|0;k=c[a>>2]|0;do{if(j>>>0>c[h>>2]<<5>>>0){if((k|0)!=0){jr(k);c[a>>2]=0;c[h>>2]=0;c[a+4>>2]=0;j=c[g>>2]|0}if((j|0)<0){io(0)}else{f=((j+ -1|0)>>>5)+1|0;e=hr(f<<2)|0;c[a>>2]=e;c[a+4>>2]=0;c[h>>2]=f;f=c[g>>2]|0;break}}else{f=j;e=k}}while(0);Gr(e|0,c[b>>2]|0,((f+ -1|0)>>>5<<2)+4|0)|0;e=c[g>>2]|0}c[a+4>>2]=e;i=d;return a|0}function Dg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;k=b;j=(d-k|0)/12|0;g=a+8|0;m=c[g>>2]|0;f=c[a>>2]|0;l=f;if(j>>>0>((m-l|0)/12|0)>>>0){if((f|0)!=0){l=a+4|0;while(1){k=c[l>>2]|0;if((k|0)==(f|0)){break}m=k+ -12|0;c[l>>2]=m;Ud(m)}jr(c[a>>2]|0);c[g>>2]=0;c[l>>2]=0;c[a>>2]=0;m=0}if(j>>>0>357913941){io(0)}f=(m|0)/12|0;if(f>>>0<178956970){f=f<<1;f=f>>>0<j>>>0?j:f;if(f>>>0>357913941){io(0)}else{h=f}}else{h=357913941}j=hr(h*12|0)|0;f=a+4|0;c[f>>2]=j;c[a>>2]=j;c[g>>2]=j+(h*12|0);if((b|0)==(d|0)){i=e;return}do{if((j|0)==0){g=0}else{Zd(j,b);g=c[f>>2]|0}j=g+12|0;c[f>>2]=j;b=b+12|0}while((b|0)!=(d|0));i=e;return}g=a+4|0;h=((c[g>>2]|0)-l|0)/12|0;if(j>>>0>h>>>0){a=b+(h*12|0)|0;h=1}else{a=d;h=0}if((a|0)!=(b|0)){j=a+ -12+(0-k)|0;k=f;while(1){fe(k,b);b=b+12|0;if((b|0)==(a|0)){break}else{k=k+12|0}}f=f+((((j>>>0)/12|0)+1|0)*12|0)|0}if(!h){while(1){d=c[g>>2]|0;if((d|0)==(f|0)){break}m=d+ -12|0;c[g>>2]=m;Ud(m)}i=e;return}if((a|0)==(d|0)){i=e;return}b=c[g>>2]|0;do{if((b|0)==0){b=0}else{Zd(b,a);b=c[g>>2]|0}b=b+12|0;c[g>>2]=b;a=a+12|0}while((a|0)!=(d|0));i=e;return}function Eg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;k=b;j=(d-k|0)/12|0;g=a+8|0;m=c[g>>2]|0;h=c[a>>2]|0;l=h;if(j>>>0>((m-l|0)/12|0)>>>0){if((h|0)!=0){k=a+4|0;n=c[k>>2]|0;if((n|0)!=(h|0)){while(1){l=n+ -12|0;c[k>>2]=l;m=c[l>>2]|0;if((m|0)!=0){n=n+ -8|0;while(1){o=c[n>>2]|0;if((o|0)==(m|0)){break}o=o+ -12|0;c[n>>2]=o;Ud(o)}jr(c[l>>2]|0);l=c[k>>2]|0}if((l|0)==(h|0)){break}else{n=l}}h=c[a>>2]|0}jr(h);c[g>>2]=0;c[k>>2]=0;c[a>>2]=0;m=0}if(j>>>0>357913941){io(0)}h=(m|0)/12|0;if(h>>>0<178956970){h=h<<1;h=h>>>0<j>>>0?j:h;if(h>>>0>357913941){io(0)}else{f=h}}else{f=357913941}j=hr(f*12|0)|0;h=a+4|0;c[h>>2]=j;c[a>>2]=j;c[g>>2]=j+(f*12|0);if((b|0)==(d|0)){i=e;return}do{if((j|0)==0){f=0}else{Fg(j,b);f=c[h>>2]|0}j=f+12|0;c[h>>2]=j;b=b+12|0}while((b|0)!=(d|0));i=e;return}f=a+4|0;g=((c[f>>2]|0)-l|0)/12|0;if(j>>>0>g>>>0){a=b+(g*12|0)|0;g=1}else{a=d;g=0}if((a|0)!=(b|0)){j=a+ -12+(0-k)|0;k=h;while(1){if((k|0)!=(b|0)){Dg(k,c[b>>2]|0,c[b+4>>2]|0)}b=b+12|0;if((b|0)==(a|0)){break}else{k=k+12|0}}h=h+((((j>>>0)/12|0)+1|0)*12|0)|0}if(g){if((a|0)==(d|0)){i=e;return}b=c[f>>2]|0;do{if((b|0)==0){b=0}else{Fg(b,a);b=c[f>>2]|0}b=b+12|0;c[f>>2]=b;a=a+12|0}while((a|0)!=(d|0));i=e;return}g=c[f>>2]|0;if((g|0)==(h|0)){i=e;return}while(1){b=g+ -12|0;c[f>>2]=b;d=c[b>>2]|0;if((d|0)!=0){a=g+ -8|0;while(1){g=c[a>>2]|0;if((g|0)==(d|0)){break}o=g+ -12|0;c[a>>2]=o;Ud(o)}jr(c[b>>2]|0);b=c[f>>2]|0}if((b|0)==(h|0)){break}else{g=b}}i=e;return}function Fg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;c[a>>2]=0;d=a+4|0;c[d>>2]=0;h=a+8|0;c[h>>2]=0;g=b+4|0;l=c[g>>2]|0;k=c[b>>2]|0;f=l-k|0;j=(f|0)/12|0;if((l|0)==(k|0)){i=e;return}if(j>>>0>357913941){io(0)}f=hr(f)|0;c[d>>2]=f;c[a>>2]=f;c[h>>2]=f+(j*12|0);b=c[b>>2]|0;g=c[g>>2]|0;if((b|0)==(g|0)){i=e;return}do{if((f|0)==0){f=0}else{Zd(f,b);f=c[d>>2]|0}f=f+12|0;c[d>>2]=f;b=b+12|0}while((b|0)!=(g|0));i=e;return}function Gg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;k=b;j=(d-k|0)/12|0;g=a+8|0;m=c[g>>2]|0;h=c[a>>2]|0;l=h;if(j>>>0>((m-l|0)/12|0)>>>0){if((h|0)!=0){k=a+4|0;m=c[k>>2]|0;if((m|0)!=(h|0)){do{n=m+ -12|0;c[k>>2]=n;l=c[n>>2]|0;if((l|0)==0){m=n}else{m=m+ -8|0;n=c[m>>2]|0;if((n|0)!=(l|0)){c[m>>2]=n+(~((n+ -4+(0-l)|0)>>>2)<<2)}jr(l);m=c[k>>2]|0}}while((m|0)!=(h|0));h=c[a>>2]|0}jr(h);c[g>>2]=0;c[k>>2]=0;c[a>>2]=0;m=0}if(j>>>0>357913941){io(0)}h=(m|0)/12|0;if(h>>>0<178956970){h=h<<1;h=h>>>0<j>>>0?j:h;if(h>>>0>357913941){io(0)}else{f=h}}else{f=357913941}j=hr(f*12|0)|0;h=a+4|0;c[h>>2]=j;c[a>>2]=j;c[g>>2]=j+(f*12|0);if((b|0)==(d|0)){i=e;return}do{if((j|0)==0){a=0}else{Hg(j,b);a=c[h>>2]|0}j=a+12|0;c[h>>2]=j;b=b+12|0}while((b|0)!=(d|0));i=e;return}a=a+4|0;f=((c[a>>2]|0)-l|0)/12|0;if(j>>>0>f>>>0){g=b+(f*12|0)|0;f=1}else{g=d;f=0}if((g|0)!=(b|0)){j=g+ -12+(0-k)|0;k=h;while(1){if((k|0)!=(b|0)){Lg(k,c[b>>2]|0,c[b+4>>2]|0)}b=b+12|0;if((b|0)==(g|0)){break}else{k=k+12|0}}h=h+((((j>>>0)/12|0)+1|0)*12|0)|0}if(f){if((g|0)==(d|0)){i=e;return}b=c[a>>2]|0;do{if((b|0)==0){b=0}else{Hg(b,g);b=c[a>>2]|0}b=b+12|0;c[a>>2]=b;g=g+12|0}while((g|0)!=(d|0));i=e;return}b=c[a>>2]|0;if((b|0)==(h|0)){i=e;return}do{f=b+ -12|0;c[a>>2]=f;d=c[f>>2]|0;if((d|0)==0){b=f}else{f=b+ -8|0;b=c[f>>2]|0;if((b|0)!=(d|0)){c[f>>2]=b+(~((b+ -4+(0-d)|0)>>>2)<<2)}jr(d);b=c[a>>2]|0}}while((b|0)!=(h|0));i=e;return}function Hg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;e=i;c[a>>2]=0;d=a+4|0;c[d>>2]=0;h=a+8|0;c[h>>2]=0;g=b+4|0;f=(c[g>>2]|0)-(c[b>>2]|0)|0;j=f>>2;if((j|0)==0){i=e;return}if(j>>>0>1073741823){io(0)}f=hr(f)|0;c[d>>2]=f;c[a>>2]=f;c[h>>2]=f+(j<<2);h=c[b>>2]|0;g=c[g>>2]|0;if((h|0)==(g|0)){i=e;return}b=(g+ -4+(0-h)|0)>>>2;a=f;while(1){if((a|0)!=0){c[a>>2]=c[h>>2]}h=h+4|0;if((h|0)==(g|0)){break}else{a=a+4|0}}c[d>>2]=f+(b+1<<2);i=e;return}function Ig(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;f=b+8|0;a:do{if((c[f>>2]|0)!=0){k=c[b>>2]|0;h=b+4|0;c[b>>2]=h;c[(c[h>>2]|0)+8>>2]=0;c[h>>2]=0;c[f>>2]=0;j=c[k+4>>2]|0;if((j|0)!=0){k=j}if((k|0)!=0){j=b+4|0;l=c[d>>2]|0;while(1){if((l|0)==(c[e>>2]|0)){break}n=k+16|0;a[n]=a[l+16|0]|0;c[k+20>>2]=c[l+20>>2];l=k+8|0;m=c[l>>2]|0;do{if((m|0)!=0){if((c[m>>2]|0)==(k|0)){c[m>>2]=0;m=c[l>>2]|0;o=c[m+4>>2]|0;if((o|0)==0){break}else{m=o}while(1){o=c[m>>2]|0;if((o|0)!=0){m=o;continue}o=c[m+4>>2]|0;if((o|0)==0){break}else{m=o}}break}else{c[m+4>>2]=0;m=c[l>>2]|0;o=c[m>>2]|0;if((o|0)==0){break}else{m=o}while(1){o=c[m>>2]|0;if((o|0)!=0){m=o;continue}o=c[m+4>>2]|0;if((o|0)==0){break}else{m=o}}break}}else{m=0}}while(0);o=c[j>>2]|0;if((o|0)==0){p=h;o=h}else{n=a[n]|0;while(1){if(n<<24>>24<(a[o+16|0]|0)){p=c[o>>2]|0;if((p|0)==0){p=o;break}else{o=p;continue}}else{p=o+4|0;q=c[p>>2]|0;if((q|0)==0){break}else{o=q;continue}}}}c[k>>2]=0;c[k+4>>2]=0;c[l>>2]=o;c[p>>2]=k;l=c[c[b>>2]>>2]|0;if((l|0)!=0){c[b>>2]=l;k=c[p>>2]|0}Jg(c[j>>2]|0,k);c[f>>2]=(c[f>>2]|0)+1;k=c[d>>2]|0;l=c[k+4>>2]|0;if((l|0)==0){while(1){l=c[k+8>>2]|0;if((c[l>>2]|0)==(k|0)){break}else{k=l}}}else{while(1){k=c[l>>2]|0;if((k|0)==0){break}else{l=k}}}c[d>>2]=l;if((m|0)==0){break a}else{k=m}}h=c[k+8>>2]|0;if((h|0)!=0){k=h;while(1){h=c[k+8>>2]|0;if((h|0)==0){break}else{k=h}}}zd(b,k)}}}while(0);l=c[d>>2]|0;if((l|0)==(c[e>>2]|0)){i=g;return}j=b+4|0;h=b+4|0;do{k=l+16|0;l=c[j>>2]|0;if((l|0)==0){m=h;l=h}else{m=a[k]|0;while(1){if(m<<24>>24<(a[l+16|0]|0)){n=c[l>>2]|0;if((n|0)==0){m=l;break}else{l=n;continue}}else{n=l+4|0;o=c[n>>2]|0;if((o|0)==0){m=n;break}else{l=o;continue}}}}n=hr(24)|0;p=k;q=c[p+4>>2]|0;k=n+16|0;c[k>>2]=c[p>>2];c[k+4>>2]=q;c[n>>2]=0;c[n+4>>2]=0;c[n+8>>2]=l;c[m>>2]=n;k=c[c[b>>2]>>2]|0;if((k|0)!=0){c[b>>2]=k;n=c[m>>2]|0}Jg(c[j>>2]|0,n);c[f>>2]=(c[f>>2]|0)+1;k=c[d>>2]|0;l=c[k+4>>2]|0;if((l|0)==0){while(1){l=c[k+8>>2]|0;if((c[l>>2]|0)==(k|0)){break}else{k=l}}}else{while(1){k=c[l>>2]|0;if((k|0)==0){break}else{l=k}}}c[d>>2]=l}while((l|0)!=(c[e>>2]|0));i=g;return}function Jg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;l=(d|0)==(b|0);a[d+12|0]=l&1;if(l){i=e;return}while(1){j=d+8|0;f=c[j>>2]|0;k=f+12|0;if((a[k]|0)!=0){b=37;break}g=f+8|0;h=c[g>>2]|0;l=c[h>>2]|0;if((l|0)==(f|0)){j=c[h+4>>2]|0;if((j|0)==0){b=7;break}j=j+12|0;if((a[j]|0)!=0){b=7;break}a[k]=1;a[h+12|0]=(h|0)==(b|0)|0;a[j]=1}else{if((l|0)==0){b=24;break}l=l+12|0;if((a[l]|0)!=0){b=24;break}a[k]=1;a[h+12|0]=(h|0)==(b|0)|0;a[l]=1}if((h|0)==(b|0)){b=37;break}else{d=h}}if((b|0)==7){if((c[f>>2]|0)==(d|0)){d=f}else{l=f+4|0;d=c[l>>2]|0;j=c[d>>2]|0;c[l>>2]=j;if((j|0)!=0){c[j+8>>2]=f;h=c[g>>2]|0}j=d+8|0;c[j>>2]=h;h=c[g>>2]|0;if((c[h>>2]|0)==(f|0)){c[h>>2]=d}else{c[h+4>>2]=d}c[d>>2]=f;c[g>>2]=d;f=c[j>>2]|0;h=f;f=c[f>>2]|0}a[d+12|0]=1;a[h+12|0]=0;g=f+4|0;d=c[g>>2]|0;c[h>>2]=d;if((d|0)!=0){c[d+8>>2]=h}d=h+8|0;c[f+8>>2]=c[d>>2];j=c[d>>2]|0;if((c[j>>2]|0)==(h|0)){c[j>>2]=f}else{c[j+4>>2]=f}c[g>>2]=h;c[d>>2]=f;i=e;return}else if((b|0)==24){if((c[f>>2]|0)==(d|0)){b=d+4|0;k=c[b>>2]|0;c[f>>2]=k;if((k|0)!=0){c[k+8>>2]=f;h=c[g>>2]|0}c[j>>2]=h;h=c[g>>2]|0;if((c[h>>2]|0)==(f|0)){c[h>>2]=d}else{c[h+4>>2]=d}c[b>>2]=f;c[g>>2]=d;f=d;h=c[j>>2]|0}a[f+12|0]=1;a[h+12|0]=0;l=h+4|0;f=c[l>>2]|0;g=c[f>>2]|0;c[l>>2]=g;if((g|0)!=0){c[g+8>>2]=h}g=h+8|0;c[f+8>>2]=c[g>>2];d=c[g>>2]|0;if((c[d>>2]|0)==(h|0)){c[d>>2]=f}else{c[d+4>>2]=f}c[f>>2]=h;c[g>>2]=f;i=e;return}else if((b|0)==37){i=e;return}}function Kg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;f=b+8|0;a:do{if((c[f>>2]|0)!=0){k=c[b>>2]|0;h=b+4|0;c[b>>2]=h;c[(c[h>>2]|0)+8>>2]=0;c[h>>2]=0;c[f>>2]=0;j=c[k+4>>2]|0;if((j|0)!=0){k=j}if((k|0)!=0){j=b+4|0;l=c[d>>2]|0;while(1){if((l|0)==(c[e>>2]|0)){break}m=c[l+16>>2]|0;c[k+16>>2]=m;a[k+20|0]=a[l+20|0]|0;l=k+8|0;n=c[l>>2]|0;do{if((n|0)!=0){if((c[n>>2]|0)==(k|0)){c[n>>2]=0;n=c[l>>2]|0;o=c[n+4>>2]|0;if((o|0)==0){break}else{n=o}while(1){o=c[n>>2]|0;if((o|0)!=0){n=o;continue}o=c[n+4>>2]|0;if((o|0)==0){break}else{n=o}}break}else{c[n+4>>2]=0;n=c[l>>2]|0;o=c[n>>2]|0;if((o|0)==0){break}else{n=o}while(1){o=c[n>>2]|0;if((o|0)!=0){n=o;continue}o=c[n+4>>2]|0;if((o|0)==0){break}else{n=o}}break}}else{n=0}}while(0);o=c[j>>2]|0;if((o|0)==0){p=h;o=h}else{while(1){if(m>>>0<(c[o+16>>2]|0)>>>0){p=c[o>>2]|0;if((p|0)==0){p=o;break}else{o=p;continue}}else{p=o+4|0;q=c[p>>2]|0;if((q|0)==0){break}else{o=q;continue}}}}c[k>>2]=0;c[k+4>>2]=0;c[l>>2]=o;c[p>>2]=k;l=c[c[b>>2]>>2]|0;if((l|0)!=0){c[b>>2]=l;k=c[p>>2]|0}Jg(c[j>>2]|0,k);c[f>>2]=(c[f>>2]|0)+1;k=c[d>>2]|0;l=c[k+4>>2]|0;if((l|0)==0){while(1){l=c[k+8>>2]|0;if((c[l>>2]|0)==(k|0)){break}else{k=l}}}else{while(1){k=c[l>>2]|0;if((k|0)==0){break}else{l=k}}}c[d>>2]=l;if((n|0)==0){break a}else{k=n}}h=c[k+8>>2]|0;if((h|0)!=0){k=h;while(1){h=c[k+8>>2]|0;if((h|0)==0){break}else{k=h}}}yd(b,k)}}}while(0);l=c[d>>2]|0;if((l|0)==(c[e>>2]|0)){i=g;return}j=b+4|0;h=b+4|0;do{k=l+16|0;m=c[j>>2]|0;if((m|0)==0){l=h;m=h}else{l=c[k>>2]|0;while(1){if(l>>>0<(c[m+16>>2]|0)>>>0){n=c[m>>2]|0;if((n|0)==0){l=m;break}else{m=n;continue}}else{n=m+4|0;o=c[n>>2]|0;if((o|0)==0){l=n;break}else{m=o;continue}}}}n=hr(24)|0;p=k;q=c[p+4>>2]|0;k=n+16|0;c[k>>2]=c[p>>2];c[k+4>>2]=q;c[n>>2]=0;c[n+4>>2]=0;c[n+8>>2]=m;c[l>>2]=n;k=c[c[b>>2]>>2]|0;if((k|0)!=0){c[b>>2]=k;n=c[l>>2]|0}Jg(c[j>>2]|0,n);c[f>>2]=(c[f>>2]|0)+1;k=c[d>>2]|0;l=c[k+4>>2]|0;if((l|0)==0){while(1){l=c[k+8>>2]|0;if((c[l>>2]|0)==(k|0)){break}else{k=l}}}else{while(1){k=c[l>>2]|0;if((k|0)==0){break}else{l=k}}}c[d>>2]=l}while((l|0)!=(c[e>>2]|0));i=g;return}function Lg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;f=b;j=d-f>>2;h=a+8|0;m=c[h>>2]|0;k=c[a>>2]|0;l=k;if(!(j>>>0>m-l>>2>>>0)){g=a+4|0;h=(c[g>>2]|0)-l|0;a=h>>2;if(!(j>>>0>a>>>0)){d=d-f|0;Gr(k|0,b|0,d|0)|0;d=k+(d>>2<<2)|0;b=c[g>>2]|0;if((b|0)==(d|0)){i=e;return}c[g>>2]=b+(~((b+ -4+(0-d)|0)>>>2)<<2);i=e;return}f=b+(a<<2)|0;Gr(k|0,b|0,h|0)|0;if((f|0)==(d|0)){i=e;return}h=c[g>>2]|0;b=(d+ -4+(0-f)|0)>>>2;a=h;while(1){if((a|0)!=0){c[a>>2]=c[f>>2]}f=f+4|0;if((f|0)==(d|0)){break}else{a=a+4|0}}c[g>>2]=h+(b+1<<2);i=e;return}if((k|0)!=0){n=a+4|0;m=c[n>>2]|0;if((m|0)!=(k|0)){c[n>>2]=m+(~((m+ -4+(0-l)|0)>>>2)<<2)}jr(k);c[h>>2]=0;c[n>>2]=0;c[a>>2]=0;m=0}if(j>>>0>1073741823){io(0)}if(m>>2>>>0<536870911){k=m>>1;j=k>>>0<j>>>0?j:k;if(j>>>0>1073741823){io(0)}else{g=j}}else{g=1073741823}k=hr(g<<2)|0;j=a+4|0;c[j>>2]=k;c[a>>2]=k;c[h>>2]=k+(g<<2);if((b|0)==(d|0)){i=e;return}f=(d+ -4+(0-f)|0)>>>2;g=k;while(1){if((g|0)!=0){c[g>>2]=c[b>>2]}b=b+4|0;if((b|0)==(d|0)){break}else{g=g+4|0}}c[j>>2]=k+(f+1<<2);i=e;return}function Mg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;f=c[a>>2]|0;d=a+4|0;if((f|0)==0){f=a+8|0}else{j=c[d>>2]|0;if((j|0)!=(f|0)){while(1){h=j+ -12|0;c[d>>2]=h;g=c[h>>2]|0;if((g|0)!=0){j=j+ -8|0;while(1){k=c[j>>2]|0;if((k|0)==(g|0)){break}k=k+ -12|0;c[j>>2]=k;Ud(k)}jr(c[h>>2]|0);h=c[d>>2]|0}if((h|0)==(f|0)){break}else{j=h}}f=c[a>>2]|0}jr(f);f=a+8|0;c[f>>2]=0;c[d>>2]=0;c[a>>2]=0}c[a>>2]=c[b>>2];k=b+4|0;c[d>>2]=c[k>>2];j=b+8|0;c[f>>2]=c[j>>2];c[j>>2]=0;c[k>>2]=0;c[b>>2]=0;i=e;return}function Ng(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;h=i;i=i+368|0;o=h;f=h+344|0;g=h+204|0;L=h+192|0;K=h+357|0;k=h+52|0;D=h+40|0;E=h+356|0;w=h+28|0;x=h+16|0;n=h+4|0;c[b>>2]=e;y=b+4|0;c[y>>2]=0;C=b+8|0;c[C>>2]=0;B=b+12|0;c[B>>2]=0;c[f+0>>2]=0;c[f+4>>2]=0;c[f+8>>2]=0;M=g+8|0;c[g>>2]=14220;m=g+60|0;c[m>>2]=14240;c[g+4>>2]=0;j=g+60|0;ij(j,M);c[g+132>>2]=0;c[g+136>>2]=-1;c[g>>2]=14092;c[g+60>>2]=14112;c[M>>2]=24784;l=g+12|0;po(l);e=g+16|0;c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;c[e+16>>2]=0;c[e+20>>2]=0;c[M>>2]=14256;e=g+40|0;u=g+56|0;c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;c[u>>2]=8;lh(M,d);M=L+4|0;u=b+52|0;t=b+56|0;J=b+60|0;r=b+16|0;p=b+20|0;N=b+24|0;s=b+88|0;v=b+92|0;O=b+96|0;P=f+4|0;Q=1;a:while(1){hj(o,g+(c[(c[g>>2]|0)+ -12>>2]|0)|0);Z=so(o,27512)|0;Z=Bc[c[(c[Z>>2]|0)+28>>2]&31](Z,10)|0;ro(o);Z=ah(g,f,Z)|0;if((c[Z+((c[(c[Z>>2]|0)+ -12>>2]|0)+16)>>2]&5|0)!=0){I=103;break}R=a[f]|0;if((R&1)==0){R=(R&255)>>>1}else{R=c[P>>2]|0}if((R|0)==0){I=103;break}a[K]=9;Og(L,f,K);S=c[L>>2]|0;R=((c[M>>2]|0)-S|0)/12|0;b:do{if((R|0)==0){I=94}else if((R|0)==4){if((a[S]&1)==0){R=S+1|0}else{R=c[S+8>>2]|0}R=db(R|0,0,10)|0;S=c[L>>2]|0;if(!((((c[M>>2]|0)-S|0)/12|0)>>>0>1)){I=12;break a}T=S+12|0;if((a[T]&1)==0){S=T+1|0}else{S=c[S+20>>2]|0}T=db(S|0,0,10)|0;S=c[L>>2]|0;if(!((((c[M>>2]|0)-S|0)/12|0)>>>0>2)){I=17;break a}U=S+24|0;if((a[U]&1)==0){S=U+1|0}else{S=c[S+32>>2]|0}S=db(S|0,0,10)|0;U=c[u>>2]|0;V=c[t>>2]|0;c:do{if((U|0)!=(V|0)){W=U;while(1){if((c[W>>2]|0)==(R|0)){break}W=W+4|0;if((W|0)==(V|0)){I=25;break c}}if((W|0)==(V|0)){I=25}}else{V=U;I=25}}while(0);do{if((I|0)==25){I=0;if((V|0)!=(c[J>>2]|0)){if((V|0)!=0){c[V>>2]=R}V=V+4|0;c[t>>2]=V;break}V=V-U|0;X=V>>2;W=X+1|0;if(W>>>0>1073741823){I=30;break a}if(X>>>0<536870911){Y=V>>1;Z=Y>>>0<W>>>0?W:Y;if((Z|0)==0){Y=0;Z=0}else{I=33}}else{Z=1073741823;I=33}if((I|0)==33){I=0;Y=Z;Z=hr(Z<<2)|0}X=Z+(X<<2)|0;if((X|0)!=0){c[X>>2]=R}W=Z+(W<<2)|0;Fr(Z|0,U|0,V|0)|0;c[u>>2]=Z;c[t>>2]=W;c[J>>2]=Z+(Y<<2);if((U|0)==0){V=W;U=Z}else{jr(U);V=c[t>>2]|0;U=c[u>>2]|0}}}while(0);d:do{if((U|0)!=(V|0)){W=U;while(1){if((c[W>>2]|0)==(T|0)){break}W=W+4|0;if((W|0)==(V|0)){I=42;break d}}if((W|0)==(V|0)){I=42}}else{I=42}}while(0);do{if((I|0)==42){I=0;if((V|0)!=(c[J>>2]|0)){if((V|0)!=0){c[V>>2]=T}c[t>>2]=V+4;break}V=V-U|0;X=V>>2;W=X+1|0;if(W>>>0>1073741823){I=47;break a}if(X>>>0<536870911){Y=V>>1;Z=Y>>>0<W>>>0?W:Y;if((Z|0)==0){Y=0;Z=0}else{I=50}}else{Z=1073741823;I=50}if((I|0)==50){I=0;Y=Z;Z=hr(Z<<2)|0}X=Z+(X<<2)|0;if((X|0)!=0){c[X>>2]=T}Fr(Z|0,U|0,V|0)|0;c[u>>2]=Z;c[t>>2]=Z+(W<<2);c[J>>2]=Z+(Y<<2);if((U|0)!=0){jr(U)}}}while(0);T=c[r>>2]|0;U=c[p>>2]|0;e:do{if((T|0)!=(U|0)){V=T;while(1){if((c[V>>2]|0)==(S|0)){break}V=V+4|0;if((V|0)==(U|0)){I=59;break e}}if((V|0)==(U|0)){I=59}}else{U=T;I=59}}while(0);do{if((I|0)==59){I=0;if((U|0)!=(c[N>>2]|0)){if((U|0)!=0){c[U>>2]=S}c[p>>2]=U+4;break}V=U-T|0;W=V>>2;U=W+1|0;if(U>>>0>1073741823){I=64;break a}if(W>>>0<536870911){X=V>>1;Y=X>>>0<U>>>0?U:X;if((Y|0)==0){X=0;Y=0}else{I=67}}else{Y=1073741823;I=67}if((I|0)==67){X=Y;Y=hr(Y<<2)|0}I=Y+(W<<2)|0;if((I|0)!=0){c[I>>2]=S}Fr(Y|0,T|0,V|0)|0;c[r>>2]=Y;c[p>>2]=Y+(U<<2);c[N>>2]=Y+(X<<2);if((T|0)!=0){jr(T)}}}while(0);if(Q){c[y>>2]=R;Q=0;I=94}else{Q=0;I=94}}else if((R|0)==1){if((a[S]&1)==0){R=S+1|0}else{R=c[S+8>>2]|0}R=db(R|0,0,10)|0;S=c[s>>2]|0;T=c[v>>2]|0;f:do{if((S|0)!=(T|0)){U=S;while(1){if((c[U>>2]|0)==(R|0)){break}U=U+4|0;if((U|0)==(T|0)){break f}}if((U|0)!=(T|0)){I=94;break b}}else{T=S}}while(0);if((T|0)!=(c[O>>2]|0)){if((T|0)!=0){c[T>>2]=R}c[v>>2]=T+4;I=94;break}T=T-S|0;V=T>>2;U=V+1|0;if(U>>>0>1073741823){I=86;break a}if(V>>>0<536870911){W=T>>1;X=W>>>0<U>>>0?U:W;if((X|0)==0){W=0;X=0}else{I=89}}else{X=1073741823;I=89}if((I|0)==89){W=X;X=hr(X<<2)|0}I=X+(V<<2)|0;if((I|0)!=0){c[I>>2]=R}Fr(X|0,S|0,T|0)|0;c[s>>2]=X;c[v>>2]=X+(U<<2);c[O>>2]=X+(W<<2);if((S|0)==0){I=94}else{jr(S);I=94}}else{R=0}}while(0);if((I|0)==94){I=0;R=1;S=c[L>>2]|0}if((S|0)!=0){U=c[M>>2]|0;if((U|0)!=(S|0)){while(1){T=U+ -12|0;c[M>>2]=T;if(!((a[T]&1)==0)){jr(c[U+ -4>>2]|0);T=c[M>>2]|0}if((T|0)==(S|0)){break}else{U=T}}S=c[L>>2]|0}jr(S)}if(!R){q=0;break}}do{if((I|0)==12){jo(0)}else if((I|0)==17){jo(0)}else if((I|0)==30){io(0)}else if((I|0)==47){io(0)}else if((I|0)==64){io(0)}else if((I|0)==86){io(0)}else if((I|0)==103){N=c[t>>2]|0;K=c[u>>2]|0;P=K;L=N-P|0;M=L>>2;O=c[J>>2]|0;if(!(N>>>0<O>>>0)){N=M+1|0;if(N>>>0>1073741823){io(0)}O=O-P|0;if(O>>2>>>0<536870911){O=O>>1;P=O>>>0<N>>>0?N:O;if((P|0)==0){O=0;P=0}else{I=111}}else{P=1073741823;I=111}if((I|0)==111){O=P;P=hr(P<<2)|0}I=P+(M<<2)|0;if((I|0)!=0){c[I>>2]=M}I=P+(N<<2)|0;Fr(P|0,K|0,L|0)|0;c[u>>2]=P;c[t>>2]=I;c[J>>2]=P+(O<<2);if((K|0)==0){J=I;K=P}else{jr(K);J=c[t>>2]|0;K=c[u>>2]|0}}else{if((N|0)!=0){c[N>>2]=M}J=N+4|0;c[t>>2]=J}R=c[p>>2]|0;I=c[r>>2]|0;Z=R-I>>2;c[B>>2]=Z;J=J-K>>2;c[C>>2]=J;do{if((Z|0)!=0){P=b+32|0;J=b+32|0;L=b+28|0;M=b+36|0;O=b+44|0;N=b+44|0;K=b+40|0;Q=b+48|0;S=R;R=0;while(1){if(!(S-I>>2>>>0>R>>>0)){I=119;break}T=c[I+(R<<2)>>2]|0;S=hr(24)|0;c[S+16>>2]=R;a[S+20|0]=T;T=c[P>>2]|0;do{if((T|0)!=0){while(1){I=c[T+16>>2]|0;if(R>>>0<I>>>0){I=c[T>>2]|0;if((I|0)==0){I=123;break}else{T=I;continue}}if(!(I>>>0<R>>>0)){I=127;break}U=T+4|0;I=c[U>>2]|0;if((I|0)==0){I=126;break}else{T=I}}if((I|0)==123){c[o>>2]=T;U=T;break}else if((I|0)==126){c[o>>2]=T;break}else if((I|0)==127){c[o>>2]=T;U=o;break}}else{c[o>>2]=J;U=J;T=J}}while(0);if((c[U>>2]|0)!=0){if((S|0)!=0){jr(S)}}else{c[S>>2]=0;c[S+4>>2]=0;c[S+8>>2]=T;c[U>>2]=S;I=c[c[L>>2]>>2]|0;if((I|0)!=0){c[L>>2]=I;S=c[U>>2]|0}Jg(c[P>>2]|0,S);c[M>>2]=(c[M>>2]|0)+1}I=c[r>>2]|0;if(!((c[p>>2]|0)-I>>2>>>0>R>>>0)){I=136;break}I=c[I+(R<<2)>>2]&255;S=hr(24)|0;a[S+16|0]=I;c[S+20>>2]=R;T=c[O>>2]|0;do{if((T|0)!=0){while(1){U=a[T+16|0]|0;if(I<<24>>24<U<<24>>24){U=c[T>>2]|0;if((U|0)==0){I=140;break}else{T=U;continue}}if(!(U<<24>>24<I<<24>>24)){I=144;break}U=T+4|0;V=c[U>>2]|0;if((V|0)==0){I=143;break}else{T=V}}if((I|0)==140){c[o>>2]=T;U=T;break}else if((I|0)==143){c[o>>2]=T;break}else if((I|0)==144){c[o>>2]=T;U=o;break}}else{c[o>>2]=N;U=N;T=N}}while(0);if((c[U>>2]|0)!=0){if((S|0)!=0){jr(S)}}else{c[S>>2]=0;c[S+4>>2]=0;c[S+8>>2]=T;c[U>>2]=S;I=c[c[K>>2]>>2]|0;if((I|0)!=0){c[K>>2]=I;S=c[U>>2]|0}Jg(c[O>>2]|0,S);c[Q>>2]=(c[Q>>2]|0)+1}R=R+1|0;if(!(R>>>0<(c[B>>2]|0)>>>0)){I=154;break}S=c[p>>2]|0;I=c[r>>2]|0}if((I|0)==119){jo(0)}else if((I|0)==136){jo(0)}else if((I|0)==154){H=c[C>>2]|0;break}}else{H=J}}while(0);L=b+64|0;K=b+68|0;J=c[K>>2]|0;I=c[L>>2]|0;M=(J-I|0)/12|0;if(!(M>>>0<H>>>0)){if(M>>>0>H>>>0?(G=I+(H*12|0)|0,(J|0)!=(G|0)):0){do{I=J+ -12|0;c[K>>2]=I;H=c[I>>2]|0;if((H|0)==0){J=I}else{I=J+ -8|0;J=c[I>>2]|0;if((J|0)!=(H|0)){c[I>>2]=J+(~((J+ -4+(0-H)|0)>>>2)<<2)}jr(H);J=c[K>>2]|0}}while((J|0)!=(G|0))}}else{$g(L,H-M|0)}g:do{if((c[C>>2]|0)!=0){G=0;h:while(1){J=c[L>>2]|0;if(!((((c[K>>2]|0)-J|0)/12|0)>>>0>G>>>0)){I=166;break}H=J+(G*12|0)|0;I=c[B>>2]|0;J=J+(G*12|0)+4|0;O=c[J>>2]|0;N=c[H>>2]|0;M=O-N>>2;if(!(M>>>0<I>>>0)){if(M>>>0>I>>>0?(F=N+(I<<2)|0,(O|0)!=(F|0)):0){c[J>>2]=O+(~((O+ -4+(0-F)|0)>>>2)<<2)}}else{_g(H,I-M|0);I=c[B>>2]|0}if((I|0)!=0){Z=c[L>>2]|0;I=Z+(G*12|0)+4|0;H=Z+(G*12|0)|0;if((((c[K>>2]|0)-Z|0)/12|0)>>>0>G>>>0){J=0}else{I=174;break}do{M=c[H>>2]|0;if(!((c[I>>2]|0)-M>>2>>>0>J>>>0)){I=176;break h}c[M+(J<<2)>>2]=(c[C>>2]|0)+ -1;J=J+1|0}while(J>>>0<(c[B>>2]|0)>>>0)}G=G+1|0;if(!(G>>>0<(c[C>>2]|0)>>>0)){break g}}if((I|0)==166){jo(0)}else if((I|0)==174){jo(0)}else if((I|0)==176){jo(0)}}}while(0);I=k+8|0;c[k>>2]=14220;J=k+60|0;c[J>>2]=14240;c[k+4>>2]=0;G=k+60|0;ij(G,I);c[k+132>>2]=0;c[k+136>>2]=-1;c[k>>2]=14092;c[k+60>>2]=14112;c[I>>2]=24784;H=k+12|0;po(H);F=k+16|0;c[F+0>>2]=0;c[F+4>>2]=0;c[F+8>>2]=0;c[F+12>>2]=0;c[F+16>>2]=0;c[F+20>>2]=0;c[I>>2]=14256;F=k+40|0;Z=k+56|0;c[F+0>>2]=0;c[F+4>>2]=0;c[F+8>>2]=0;c[F+12>>2]=0;c[Z>>2]=8;lh(I,d);d=D+4|0;I=b+44|0;i:while(1){hj(o,k+(c[(c[k>>2]|0)+ -12>>2]|0)|0);Z=so(o,27512)|0;Z=Bc[c[(c[Z>>2]|0)+28>>2]&31](Z,10)|0;ro(o);Z=ah(k,f,Z)|0;if((c[Z+((c[(c[Z>>2]|0)+ -12>>2]|0)+16)>>2]&5|0)!=0){I=214;break}a[E]=9;Og(D,f,E);M=c[D>>2]|0;if(((c[d>>2]|0)-M|0)==48){if((a[M]&1)==0){M=M+1|0}else{M=c[M+8>>2]|0}M=db(M|0,0,10)|0;O=c[D>>2]|0;if(!((((c[d>>2]|0)-O|0)/12|0)>>>0>2)){I=186;break}N=O+24|0;if((a[N]&1)==0){N=N+1|0}else{N=c[O+32>>2]|0}O=db(N|0,0,10)|0;P=c[D>>2]|0;if(!((((c[d>>2]|0)-P|0)/12|0)>>>0>1)){I=191;break}N=P+12|0;if((a[N]&1)==0){N=N+1|0}else{N=c[P+20>>2]|0}N=db(N|0,0,10)|0;O=O&255;P=c[I>>2]|0;if((P|0)==0){I=201;break}while(1){Q=a[P+16|0]|0;if(O<<24>>24<Q<<24>>24){P=c[P>>2]|0;if((P|0)==0){I=201;break i}else{continue}}if(!(Q<<24>>24<O<<24>>24)){break}P=c[P+4>>2]|0;if((P|0)==0){I=201;break i}}if((P|0)==0){I=201;break}O=c[P+20>>2]|0;P=c[L>>2]|0;if(!((((c[K>>2]|0)-P|0)/12|0)>>>0>M>>>0)){I=203;break}Q=c[P+(M*12|0)>>2]|0;if(!((c[P+(M*12|0)+4>>2]|0)-Q>>2>>>0>O>>>0)){I=205;break}c[Q+(O<<2)>>2]=N;M=c[D>>2]|0}if((M|0)==0){continue}N=c[d>>2]|0;if((N|0)!=(M|0)){do{O=N+ -12|0;c[d>>2]=O;if((a[O]&1)==0){N=O}else{jr(c[N+ -4>>2]|0);N=c[d>>2]|0}}while((N|0)!=(M|0));M=c[D>>2]|0}jr(M)}if((I|0)==186){jo(0)}else if((I|0)==191){jo(0)}else if((I|0)==201){Z=wb(8)|0;mi(Z,14056);c[Z>>2]=24440;ec(Z|0,24480,21)}else if((I|0)==203){jo(0)}else if((I|0)==205){jo(0)}else if((I|0)==214){d=b+76|0;Pg(d,c[C>>2]|0,0);j:do{if((c[C>>2]|0)!=0){M=b+80|0;I=0;k:while(1){if(!((c[M>>2]|0)>>>0>I>>>0)){I=217;break}O=(c[d>>2]|0)+(I>>>5<<2)|0;P=1<<(I&31);Q=c[O>>2]|P;c[O>>2]=Q;E=c[B>>2]|0;l:do{if(E>>>0>1){Z=c[L>>2]|0;S=Z+(I*12|0)+4|0;D=Z+(I*12|0)|0;if((((c[K>>2]|0)-Z|0)/12|0)>>>0>I>>>0){R=1}else{I=221;break k}while(1){T=R+ -1|0;N=c[D>>2]|0;U=(c[S>>2]|0)-N>>2;if(!(U>>>0>T>>>0)){I=223;break k}if(!(U>>>0>R>>>0)){I=225;break k}U=R+1|0;if((c[N+(T<<2)>>2]|0)!=(c[N+(R<<2)>>2]|0)){break}if(U>>>0<E>>>0){R=U}else{break l}}if(!((c[M>>2]|0)>>>0>I>>>0)){I=228;break k}c[O>>2]=Q^P}}while(0);I=I+1|0;if(!(I>>>0<(c[C>>2]|0)>>>0)){break j}}if((I|0)==217){jo(0)}else if((I|0)==221){jo(0)}else if((I|0)==223){jo(0)}else if((I|0)==225){jo(0)}else if((I|0)==228){jo(0)}}}while(0);C=c[t>>2]|0;E=c[u>>2]|0;if((((C|0)!=(E|0)?(c[v>>2]|0)!=(c[s>>2]|0):0)?(c[b+36>>2]|0)!=0:0)?(c[b+48>>2]|0)!=0:0){B=C-E>>2;while(1){D=E+4|0;if((c[E>>2]|0)>>>0>=B>>>0|(D|0)==(C|0)){break}else{E=D}}}Qg(b)|0;C=b+112|0;d=(c[b>>2]|0)+1|0;B=b+116|0;D=c[B>>2]|0;E=c[C>>2]|0;I=(D-E|0)/12|0;if(!(I>>>0<d>>>0)){if(I>>>0>d>>>0?(A=E+(d*12|0)|0,(D|0)!=(A|0)):0){do{Z=D+ -12|0;c[B>>2]=Z;Ud(Z);D=c[B>>2]|0}while((D|0)!=(A|0))}}else{Xg(C,d-I|0)}A=b+124|0;I=(c[b>>2]|0)+1|0;D=b+128|0;E=c[D>>2]|0;d=c[A>>2]|0;K=(E-d|0)/12|0;if(!(K>>>0<I>>>0)){if(K>>>0>I>>>0?(z=d+(I*12|0)|0,(E|0)!=(z|0)):0){do{Z=E+ -12|0;c[D>>2]=Z;Ud(Z);E=c[D>>2]|0}while((E|0)!=(z|0))}}else{Xg(A,I-K|0)}z=b+104|0;E=b+100|0;d=0;m:while(1){Yd(w);Yd(x);I=0;while(1){L=c[y>>2]|0;M=c[E>>2]|0;if(!((((c[z>>2]|0)-M|0)/12|0)>>>0>L>>>0)){I=250;break m}K=c[M+(L*12|0)>>2]|0;if(!((((c[M+(L*12|0)+4>>2]|0)-K|0)/12|0)>>>0>I>>>0)){I=252;break m}Pd(w,w,K+(I*12|0)|0);I=I+1|0;if(I>>>0>d>>>0){M=d;break}}do{I=c[y>>2]|0;K=c[E>>2]|0;if(!((((c[z>>2]|0)-K|0)/12|0)>>>0>I>>>0)){I=255;break m}L=c[K+(I*12|0)>>2]|0;if(!((((c[K+(I*12|0)+4>>2]|0)-L|0)/12|0)>>>0>M>>>0)){I=257;break m}Pd(x,x,L+(M*12|0)|0);M=M+1|0}while(!(M>>>0>d>>>0));I=c[C>>2]|0;if(!((((c[B>>2]|0)-I|0)/12|0)>>>0>d>>>0)){I=260;break}fe(I+(d*12|0)|0,w);I=c[A>>2]|0;if(!((((c[D>>2]|0)-I|0)/12|0)>>>0>d>>>0)){I=262;break}fe(I+(d*12|0)|0,x);Ud(x);Ud(w);d=d+1|0;if(d>>>0>(c[b>>2]|0)>>>0){I=264;break}}if((I|0)==250){jo(0)}else if((I|0)==252){jo(0)}else if((I|0)==255){jo(0)}else if((I|0)==257){jo(0)}else if((I|0)==260){jo(0)}else if((I|0)==262){jo(0)}else if((I|0)==264){Yd(n);q=c[b>>2]|0;b=c[b+112>>2]|0;if(!((((c[B>>2]|0)-b|0)/12|0)>>>0>q>>>0)){jo(0)}fe(n,b+(q*12|0)|0);if((Wd(n,1)|0)<1){q=0}else{Eh(c[r>>2]|0,c[p>>2]|0,o);Eh(c[u>>2]|0,c[t>>2]|0,o);Eh(c[s>>2]|0,c[v>>2]|0,o);q=1}Ud(n);c[k>>2]=14092;c[J>>2]=14112;n=k+8|0;c[n>>2]=14256;if(!((a[F]&1)==0)){jr(c[k+48>>2]|0)}c[n>>2]=24784;ro(H);gj(G);break}}}}while(0);c[g>>2]=14092;c[m>>2]=14112;k=g+8|0;c[k>>2]=14256;if(!((a[e]&1)==0)){jr(c[g+48>>2]|0)}c[k>>2]=24784;ro(l);gj(j);if((a[f]&1)==0){i=h;return q|0}jr(c[f+8>>2]|0);i=h;return q|0}function Og(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+160|0;h=g+12|0;n=g;c[b>>2]=0;o=b+4|0;c[o>>2]=0;l=b+8|0;c[l>>2]=0;q=h+8|0;c[h>>2]=14220;p=h+60|0;c[p>>2]=14240;c[h+4>>2]=0;f=h+60|0;ij(f,q);c[h+132>>2]=0;c[h+136>>2]=-1;c[h>>2]=14092;c[h+60>>2]=14112;c[q>>2]=24784;k=h+12|0;po(k);j=h+16|0;c[j+0>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0;c[j+12>>2]=0;c[j+16>>2]=0;c[j+20>>2]=0;c[q>>2]=14256;j=h+40|0;t=h+56|0;c[j+0>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0;c[j+12>>2]=0;c[t>>2]=8;lh(q,d);c[n+0>>2]=0;c[n+4>>2]=0;c[n+8>>2]=0;q=n+8|0;d=n+4|0;a:while(1){t=ah(h,n,a[e]|0)|0;if((c[t+((c[(c[t>>2]|0)+ -12>>2]|0)+16)>>2]&5|0)!=0){break}t=c[o>>2]|0;if((t|0)==(c[l>>2]|0)){mh(b,n);continue}do{if((t|0)!=0){if((a[n]&1)==0){c[t+0>>2]=c[n+0>>2];c[t+4>>2]=c[n+4>>2];c[t+8>>2]=c[n+8>>2];break}r=c[q>>2]|0;s=c[d>>2]|0;if(s>>>0>4294967279){m=8;break a}if(s>>>0<11){a[t]=s<<1;t=t+1|0}else{v=s+16&-16;u=hr(v)|0;c[t+8>>2]=u;c[t>>2]=v|1;c[t+4>>2]=s;t=u}Fr(t|0,r|0,s|0)|0;a[t+s|0]=0}}while(0);c[o>>2]=(c[o>>2]|0)+12}if((m|0)==8){Ii(0)}if(!((a[n]&1)==0)){jr(c[q>>2]|0)}c[h>>2]=14092;c[p>>2]=14112;l=h+8|0;c[l>>2]=14256;if((a[j]&1)==0){c[l>>2]=24784;ro(k);gj(f);i=g;return}jr(c[h+48>>2]|0);c[l>>2]=24784;ro(k);gj(f);i=g;return}function Pg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;e=i;i=i+32|0;k=e+8|0;n=e;l=a+4|0;g=c[l>>2]|0;if(!(g>>>0<b>>>0)){c[l>>2]=b;i=e;return}j=a+8|0;p=c[j>>2]|0;o=p<<5;f=b-g|0;if(f>>>0>o>>>0|g>>>0>(o-f|0)>>>0){c[k>>2]=0;h=k+4|0;c[h>>2]=0;m=k+8|0;c[m>>2]=0;if((b|0)<0){io(0)}if(o>>>0>1073741822){o=2147483647}else{o=p<<6;p=b+31&-32;o=o>>>0<p>>>0?p:o}Yg(k,o);s=c[l>>2]|0;p=s+f|0;c[h>>2]=p;o=c[k>>2]|0;if((s|0)>0){q=c[a>>2]|0;r=s>>>5;Gr(o|0,q|0,r<<2|0)|0;s=s-(r<<5)|0;t=o+(r<<2)|0;if((s|0)>0){u=-1>>>(32-s|0);c[t>>2]=c[t>>2]&~u|c[q+(r<<2)>>2]&u}else{s=0}}else{t=o;s=0}c[n>>2]=t;c[n+4>>2]=s;q=c[n+4>>2]|0;n=c[n>>2]|0;r=c[a>>2]|0;c[a>>2]=o;c[k>>2]=r;u=c[l>>2]|0;c[l>>2]=p;c[h>>2]=u;u=c[j>>2]|0;c[j>>2]=c[m>>2];c[m>>2]=u;if((r|0)!=0){jr(r)}}else{n=(c[a>>2]|0)+(g>>>5<<2)|0;c[l>>2]=b;q=g&31}if((g|0)==(b|0)){i=e;return}b=(q|0)==0;if(d){if(!b){d=32-q|0;u=d>>>0>f>>>0?f:d;c[n>>2]=c[n>>2]|-1>>>(d-u|0)&-1<<q;f=f-u|0;n=n+4|0}d=f>>>5;Hr(n|0,-1,d<<2|0)|0;b=d<<5;if((f|0)==(b|0)){i=e;return}u=n+(d<<2)|0;c[u>>2]=c[u>>2]|-1>>>(32-f+b|0);i=e;return}else{if(!b){d=32-q|0;u=d>>>0>f>>>0?f:d;c[n>>2]=c[n>>2]&~(-1>>>(d-u|0)&-1<<q);n=n+4|0;f=f-u|0}d=f>>>5;Hr(n|0,0,d<<2|0)|0;b=d<<5;if((f|0)==(b|0)){i=e;return}u=n+(d<<2)|0;c[u>>2]=c[u>>2]&~(-1>>>(32-f+b|0));i=e;return}}function Qg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;d=i;b=a+100|0;g=a+8|0;k=c[g>>2]|0;e=a+104|0;j=c[e>>2]|0;l=c[b>>2]|0;m=(j-l|0)/12|0;if(!(m>>>0<k>>>0)){if(m>>>0>k>>>0?(h=l+(k*12|0)|0,(j|0)!=(h|0)):0){l=j;while(1){k=l+ -12|0;c[e>>2]=k;j=c[k>>2]|0;if((j|0)!=0){m=l+ -8|0;while(1){l=c[m>>2]|0;if((l|0)==(j|0)){break}p=l+ -12|0;c[m>>2]=p;Ud(p)}jr(c[k>>2]|0);k=c[e>>2]|0}if((k|0)==(h|0)){break}else{l=k}}}}else{Vg(b,k-m|0)}a:do{if((c[g>>2]|0)!=0){h=0;b:while(1){j=c[b>>2]|0;if(!((((c[e>>2]|0)-j|0)/12|0)>>>0>h>>>0)){f=14;break}k=j+(h*12|0)|0;l=(c[a>>2]|0)+1|0;j=j+(h*12|0)+4|0;n=c[j>>2]|0;o=c[k>>2]|0;m=(n-o|0)/12|0;if(!(m>>>0<l>>>0)){if(m>>>0>l>>>0?(f=o+(l*12|0)|0,(n|0)!=(f|0)):0){while(1){n=n+ -12|0;c[j>>2]=n;Ud(n);n=c[j>>2]|0;if((n|0)==(f|0)){l=0;break}}}else{l=0}}else{Xg(k,l-m|0);l=0}do{k=c[b>>2]|0;if(!((((c[e>>2]|0)-k|0)/12|0)>>>0>h>>>0)){f=21;break b}j=c[k+(h*12|0)>>2]|0;if(!((((c[k+(h*12|0)+4>>2]|0)-j|0)/12|0)>>>0>l>>>0)){f=23;break b}ge(j+(l*12|0)|0,0);l=l+1|0}while(!(l>>>0>(c[a>>2]|0)>>>0));h=h+1|0;if(!(h>>>0<(c[g>>2]|0)>>>0)){break a}}if((f|0)==14){jo(0)}else if((f|0)==21){jo(0)}else if((f|0)==23){jo(0)}}}while(0);h=c[a+88>>2]|0;f=a+92|0;c:do{if((h|0)!=(c[f>>2]|0)){while(1){g=c[h>>2]|0;j=c[b>>2]|0;if(!((((c[e>>2]|0)-j|0)/12|0)>>>0>g>>>0)){f=30;break}k=c[j+(g*12|0)>>2]|0;if((c[j+(g*12|0)+4>>2]|0)==(k|0)){f=32;break}ge(k,1);h=h+4|0;if((h|0)==(c[f>>2]|0)){break c}}if((f|0)==30){jo(0)}else if((f|0)==32){jo(0)}}}while(0);j=c[a>>2]|0;if((j|0)==0){i=d;return 1}g=a+68|0;f=a+64|0;m=c[f>>2]|0;k=c[g>>2]|0;l=m;h=1;d:while(1){if((k|0)==(l|0)){n=m;m=l;k=l}else{j=h+ -1|0;o=k;k=0;do{if((o|0)==(m|0)){f=38;break d}n=o-m|0;l=0;while(1){if(!(l>>>0<(c[m+4>>2]|0)-(c[m>>2]|0)>>2>>>0)){break}if(!(((n|0)/12|0)>>>0>k>>>0)){f=41;break d}n=c[m+(k*12|0)>>2]|0;if(!((c[m+(k*12|0)+4>>2]|0)-n>>2>>>0>l>>>0)){f=43;break d}m=c[n+(l<<2)>>2]|0;n=c[b>>2]|0;p=((c[e>>2]|0)-n|0)/12|0;if(!(p>>>0>k>>>0)){f=45;break d}o=c[n+(k*12|0)>>2]|0;if(!((((c[n+(k*12|0)+4>>2]|0)-o|0)/12|0)>>>0>h>>>0)){f=47;break d}if(!(p>>>0>m>>>0)){f=49;break d}p=c[n+(m*12|0)>>2]|0;if(!((((c[n+(m*12|0)+4>>2]|0)-p|0)/12|0)>>>0>j>>>0)){f=51;break d}o=o+(h*12|0)|0;Pd(o,o,p+(j*12|0)|0);o=c[g>>2]|0;m=c[f>>2]|0;if((o|0)==(m|0)){f=38;break d}else{n=o-m|0;l=l+1|0}}k=k+1|0}while(k>>>0<((o-m|0)/12|0)>>>0);j=c[a>>2]|0;n=m;k=o}h=h+1|0;if(h>>>0>j>>>0){f=56;break}else{l=m;m=n}}if((f|0)==38){jo(0)}else if((f|0)==41){jo(0)}else if((f|0)==43){jo(0)}else if((f|0)==45){jo(0)}else if((f|0)==47){jo(0)}else if((f|0)==49){jo(0)}else if((f|0)==51){jo(0)}else if((f|0)==56){i=d;return 1}return 0}function Rg(b){b=b|0;var d=0,e=0;d=i;c[b>>2]=14092;c[b+60>>2]=14112;e=b+8|0;c[e>>2]=14256;if(!((a[b+40|0]&1)==0)){jr(c[b+48>>2]|0)}c[e>>2]=24784;ro(b+12|0);gj(b+60|0);i=d;return}function Sg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;h=i;i=i+48|0;g=h+24|0;k=h+12|0;f=h;Zd(g,d);l=b+116|0;m=b+112|0;d=0;while(1){Yd(k);n=c[m>>2]|0;if(!((((c[l>>2]|0)-n|0)/12|0)>>>0>d>>>0)){A=3;break}fe(k,n+(d*12|0)|0);if((Vd(g,k)|0)<0){n=d+ -1|0;o=c[m>>2]|0;if(!((((c[l>>2]|0)-o|0)/12|0)>>>0>n>>>0)){A=6;break}fe(k,o+(n*12|0)|0);je(g,g,k);n=1}else{n=0;d=d+1|0}Ud(k);if(n){A=10;break}}if((A|0)==3){jo(0)}else if((A|0)==6){jo(0)}else if((A|0)==10){if(d>>>0>(c[b>>2]|0)>>>0){C=0;Ud(g);i=h;return C|0}x=c[b+4>>2]|0;_d(f,0);a:do{if((d|0)!=0){v=b+80|0;o=b+76|0;s=b+68|0;t=b+64|0;u=b+104|0;m=b+100|0;n=b+32|0;k=e+4|0;r=e+1|0;l=e+8|0;q=f+8|0;p=f+4|0;w=1;b:while(1){if(!((c[v>>2]|0)>>>0>x>>>0)){A=14;break}y=c[t>>2]|0;z=(((c[s>>2]|0)-y|0)/12|0)>>>0>x>>>0;c:do{if((c[(c[o>>2]|0)+(x>>>5<<2)>>2]&1<<(x&31)|0)==0){if(!z){A=26;break b}z=c[y+(x*12|0)>>2]|0;if((c[y+(x*12|0)+4>>2]|0)==(z|0)){A=30;break b}B=c[z>>2]|0;z=c[m>>2]|0;if(!((((c[u>>2]|0)-z|0)/12|0)>>>0>B>>>0)){A=31;break b}y=d-w|0;A=0;while(1){C=c[z+(B*12|0)>>2]|0;if(!((((c[z+(B*12|0)+4>>2]|0)-C|0)/12|0)>>>0>y>>>0)){A=33;break b}z=C+(y*12|0)|0;if(!((Vd(g,z)|0)>-1)){y=A;x=B;break c}je(g,g,z);A=A+1|0;z=c[t>>2]|0;if(!((((c[s>>2]|0)-z|0)/12|0)>>>0>x>>>0)){A=36;break b}B=c[z+(x*12|0)>>2]|0;if(!((c[z+(x*12|0)+4>>2]|0)-B>>2>>>0>A>>>0)){A=38;break b}B=c[B+(A<<2)>>2]|0;z=c[m>>2]|0;if(!((((c[u>>2]|0)-z|0)/12|0)>>>0>B>>>0)){A=31;break b}}}else{if(!z){A=17;break b}z=c[y+(x*12|0)>>2]|0;if((c[y+(x*12|0)+4>>2]|0)==(z|0)){A=19;break b}x=c[z>>2]|0;y=c[m>>2]|0;if(!((((c[u>>2]|0)-y|0)/12|0)>>>0>x>>>0)){A=21;break b}A=d-w|0;z=c[y+(x*12|0)>>2]|0;if(!((((c[y+(x*12|0)+4>>2]|0)-z|0)/12|0)>>>0>A>>>0)){A=23;break b}Xd(f,g,g,z+(A*12|0)|0);y=(c[p>>2]|0)!=0?c[c[q>>2]>>2]|0:0}}while(0);A=c[n>>2]|0;if((A|0)==0){A=46;break}while(1){z=c[A+16>>2]|0;if(y>>>0<z>>>0){A=c[A>>2]|0;if((A|0)==0){A=46;break b}else{continue}}if(!(z>>>0<y>>>0)){break}A=c[A+4>>2]|0;if((A|0)==0){A=46;break b}}if((A|0)==0){A=46;break}y=a[A+20|0]|0;z=a[e]|0;A=(z&1)!=0;if(A){B=(c[e>>2]&-2)+ -1|0;z=c[k>>2]|0}else{B=10;z=(z&255)>>>1}if((z|0)==(B|0)){Xi(e,B,1,B,B,0,0);if((a[e]&1)==0){A=53}else{A=54}}else{if(A){A=54}else{A=53}}if((A|0)==53){a[e]=(z<<1)+2;C=r;B=z+1|0}else if((A|0)==54){C=c[l>>2]|0;B=z+1|0;c[k>>2]=B}a[C+z|0]=y;a[C+B|0]=0;w=w+1|0;if(w>>>0>d>>>0){j=x;break a}}if((A|0)==14){jo(0)}else if((A|0)==17){jo(0)}else if((A|0)==19){jo(0)}else if((A|0)==21){jo(0)}else if((A|0)==23){jo(0)}else if((A|0)==26){jo(0)}else if((A|0)==30){jo(0)}else if((A|0)==31){jo(0)}else if((A|0)==33){jo(0)}else if((A|0)==36){jo(0)}else if((A|0)==38){jo(0)}else if((A|0)==46){C=wb(8)|0;mi(C,14056);c[C>>2]=24440;ec(C|0,24480,21)}}else{j=x}}while(0);e=c[b+88>>2]|0;b=c[b+92>>2]|0;d=b-e>>2;if((d|0)!=0){do{k=(d|0)/2|0;if((c[e+(k<<2)>>2]|0)>>>0<j>>>0){e=e+(k+1<<2)|0;d=d+ -1-k|0}else{d=k}}while((d|0)!=0)}if((e|0)==(b|0)){j=0}else{j=j>>>0>=(c[e>>2]|0)>>>0}Ud(f);C=j;Ud(g);i=h;return C|0}return 0}function Tg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;h=i;i=i+32|0;f=h+12|0;g=h;k=a[d]|0;if((k&1)==0){k=(k&255)>>>1}else{k=c[d+4>>2]|0}w=c[b+4>>2]|0;_d(f,0);a:do{if((k|0)!=0){t=d+1|0;s=b+44|0;r=b+80|0;m=b+76|0;o=b+68|0;n=b+64|0;u=b+104|0;q=b+100|0;p=d+8|0;l=d+4|0;v=1;b:while(1){x=v+ -1|0;z=a[d]|0;y=(z&1)==0;if(y){z=(z&255)>>>1}else{z=c[l>>2]|0}if(!(z>>>0>x>>>0)){d=10;break}if(y){z=t}else{z=c[p>>2]|0}y=c[s>>2]|0;if((y|0)==0){d=20;break}x=a[z+x|0]|0;while(1){z=a[y+16|0]|0;if(x<<24>>24<z<<24>>24){y=c[y>>2]|0;if((y|0)==0){d=20;break b}else{continue}}if(!(z<<24>>24<x<<24>>24)){break}y=c[y+4>>2]|0;if((y|0)==0){d=20;break b}}if((y|0)==0){d=20;break}x=c[y+20>>2]|0;if(!((c[r>>2]|0)>>>0>w>>>0)){d=22;break}if((c[(c[m>>2]|0)+(w>>>5<<2)>>2]&1<<(w&31)|0)==0){if((x|0)!=0){z=k-v|0;y=1;do{C=c[n>>2]|0;if(!((((c[o>>2]|0)-C|0)/12|0)>>>0>w>>>0)){d=36;break b}A=y+ -1|0;B=c[C+(w*12|0)>>2]|0;if(!((c[C+(w*12|0)+4>>2]|0)-B>>2>>>0>A>>>0)){d=38;break b}B=c[B+(A<<2)>>2]|0;C=c[q>>2]|0;if(!((((c[u>>2]|0)-C|0)/12|0)>>>0>B>>>0)){d=40;break b}A=c[C+(B*12|0)>>2]|0;if(!((((c[C+(B*12|0)+4>>2]|0)-A|0)/12|0)>>>0>z>>>0)){d=42;break b}Pd(e,e,A+(z*12|0)|0);y=y+1|0}while(!(y>>>0>x>>>0))}}else{y=c[n>>2]|0;if(!((((c[o>>2]|0)-y|0)/12|0)>>>0>w>>>0)){d=27;break}z=c[y+(w*12|0)>>2]|0;if((c[y+(w*12|0)+4>>2]|0)==(z|0)){d=29;break}A=c[z>>2]|0;B=c[q>>2]|0;if(!((((c[u>>2]|0)-B|0)/12|0)>>>0>A>>>0)){d=31;break}y=k-v|0;z=c[B+(A*12|0)>>2]|0;if(!((((c[B+(A*12|0)+4>>2]|0)-z|0)/12|0)>>>0>y>>>0)){d=33;break}ce(f,z+(y*12|0)|0,x);Pd(e,e,f)}y=c[n>>2]|0;if(!((((c[o>>2]|0)-y|0)/12|0)>>>0>w>>>0)){d=45;break}z=c[y+(w*12|0)>>2]|0;if(!((c[y+(w*12|0)+4>>2]|0)-z>>2>>>0>x>>>0)){d=47;break}w=c[z+(x<<2)>>2]|0;v=v+1|0;if(v>>>0>k>>>0){j=w;break a}}if((d|0)==10){Ji(0)}else if((d|0)==20){C=wb(8)|0;mi(C,14056);c[C>>2]=24440;ec(C|0,24480,21)}else if((d|0)==22){jo(0)}else if((d|0)==27){jo(0)}else if((d|0)==29){jo(0)}else if((d|0)==31){jo(0)}else if((d|0)==33){jo(0)}else if((d|0)==36){jo(0)}else if((d|0)==38){jo(0)}else if((d|0)==40){jo(0)}else if((d|0)==42){jo(0)}else if((d|0)==45){jo(0)}else if((d|0)==47){jo(0)}}else{j=w}}while(0);l=c[b+88>>2]|0;d=c[b+92>>2]|0;m=d-l>>2;if((m|0)!=0){do{n=(m|0)/2|0;if((c[l+(n<<2)>>2]|0)>>>0<j>>>0){l=l+(n+1<<2)|0;m=m+ -1-n|0}else{m=n}}while((m|0)!=0)}if((l|0)==(d|0)){C=0;Ud(f);i=h;return C|0}if(j>>>0<(c[l>>2]|0)>>>0){C=0;Ud(f);i=h;return C|0}Yd(g);k=k+ -1|0;j=c[b+112>>2]|0;if(!((((c[b+116>>2]|0)-j|0)/12|0)>>>0>k>>>0)){jo(0)}fe(g,j+(k*12|0)|0);Pd(e,e,g);Ud(g);C=1;Ud(f);i=h;return C|0}function Ug(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=c[a>>2]|0;f=c[a+112>>2]|0;if((((c[a+116>>2]|0)-f|0)/12|0)>>>0>e>>>0){fe(b,f+(e*12|0)|0);i=d;return 1}else{jo(0)}return 0}function Vg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=i;f=a+8|0;e=a+4|0;h=c[e>>2]|0;k=c[f>>2]|0;g=h;if(!(((k-g|0)/12|0)>>>0<b>>>0)){do{if((h|0)==0){f=0}else{c[h>>2]=0;c[h+4>>2]=0;c[h+8>>2]=0;f=c[e>>2]|0}h=f+12|0;c[e>>2]=h;b=b+ -1|0}while((b|0)!=0);i=d;return}l=c[a>>2]|0;g=(g-l|0)/12|0;h=g+b|0;if(h>>>0>357913941){io(0)}k=(k-l|0)/12|0;if(k>>>0<178956970){k=k<<1;h=k>>>0<h>>>0?h:k;if((h|0)==0){l=0;h=0}else{j=9}}else{h=357913941;j=9}if((j|0)==9){l=h;h=hr(h*12|0)|0}k=h+(g*12|0)|0;j=k;do{if((j|0)==0){j=0}else{c[j>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0}j=j+12|0;b=b+ -1|0}while((b|0)!=0);b=h+(l*12|0)|0;l=c[a>>2]|0;m=c[e>>2]|0;if((m|0)!=(l|0)){g=g+ -1-(((m+ -12+(0-l)|0)>>>0)/12|0)|0;while(1){n=m+ -12|0;o=k+ -12|0;c[o>>2]=0;q=k+ -8|0;c[q>>2]=0;p=k+ -4|0;c[p>>2]=0;c[o>>2]=c[n>>2];o=m+ -8|0;c[q>>2]=c[o>>2];m=m+ -4|0;c[p>>2]=c[m>>2];c[m>>2]=0;c[o>>2]=0;c[n>>2]=0;if((n|0)==(l|0)){break}else{m=n;k=k+ -12|0}}k=c[a>>2]|0;l=c[e>>2]|0;c[a>>2]=h+(g*12|0);c[e>>2]=j;c[f>>2]=b;if((l|0)!=(k|0)){while(1){e=l+ -12|0;f=c[e>>2]|0;if((f|0)!=0){a=l+ -8|0;while(1){g=c[a>>2]|0;if((g|0)==(f|0)){break}q=g+ -12|0;c[a>>2]=q;Ud(q)}jr(c[e>>2]|0)}if((e|0)==(k|0)){break}else{l=e}}}}else{c[a>>2]=k;c[e>>2]=j;c[f>>2]=b;k=l}if((k|0)==0){i=d;return}jr(k);i=d;return}function Wg(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0;g=i;j=c[b>>2]|0;k=c[a>>2]|0;l=c[d>>2]|0;h=l>>>0<j>>>0;do{if(j>>>0<k>>>0){if(h){c[a>>2]=l;c[d>>2]=k;h=1;j=k;break}c[a>>2]=j;c[b>>2]=k;j=c[d>>2]|0;if(j>>>0<k>>>0){c[b>>2]=j;c[d>>2]=k;h=2;j=k}else{h=1}}else{if(h){c[b>>2]=l;c[d>>2]=j;h=c[b>>2]|0;k=c[a>>2]|0;if(h>>>0<k>>>0){c[a>>2]=h;c[b>>2]=k;h=2;j=c[d>>2]|0}else{h=1}}else{h=0;j=l}}}while(0);k=c[e>>2]|0;do{if(k>>>0<j>>>0){c[d>>2]=k;c[e>>2]=j;l=h+1|0;k=c[d>>2]|0;j=c[b>>2]|0;if(k>>>0<j>>>0){c[b>>2]=k;c[d>>2]=j;j=c[b>>2]|0;k=c[a>>2]|0;if(j>>>0<k>>>0){c[a>>2]=j;c[b>>2]=k;h=h+3|0;break}else{h=h+2|0;break}}else{h=l}}}while(0);j=c[f>>2]|0;k=c[e>>2]|0;if(!(j>>>0<k>>>0)){l=h;i=g;return l|0}c[e>>2]=j;c[f>>2]=k;f=c[e>>2]|0;j=c[d>>2]|0;if(!(f>>>0<j>>>0)){l=h+1|0;i=g;return l|0}c[d>>2]=f;c[e>>2]=j;e=c[d>>2]|0;f=c[b>>2]|0;if(!(e>>>0<f>>>0)){l=h+2|0;i=g;return l|0}c[b>>2]=e;c[d>>2]=f;d=c[b>>2]|0;e=c[a>>2]|0;if(!(d>>>0<e>>>0)){l=h+3|0;i=g;return l|0}c[a>>2]=d;c[b>>2]=e;l=h+4|0;i=g;return l|0}function Xg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;f=a+8|0;e=a+4|0;j=c[e>>2]|0;k=c[f>>2]|0;h=j;if(!(((k-h|0)/12|0)>>>0<b>>>0)){do{if((j|0)==0){f=0}else{Yd(j);f=c[e>>2]|0}j=f+12|0;c[e>>2]=j;b=b+ -1|0}while((b|0)!=0);i=d;return}l=c[a>>2]|0;h=(h-l|0)/12|0;j=h+b|0;if(j>>>0>357913941){io(0)}k=(k-l|0)/12|0;if(k>>>0<178956970){k=k<<1;k=k>>>0<j>>>0?j:k;if((k|0)==0){j=0;k=0}else{g=9}}else{k=357913941;g=9}if((g|0)==9){j=k;k=hr(k*12|0)|0}h=k+(h*12|0)|0;g=k+(j*12|0)|0;j=h;do{if((j|0)==0){j=0}else{Yd(j)}j=j+12|0;b=b+ -1|0}while((b|0)!=0);b=c[a>>2]|0;k=c[e>>2]|0;if((k|0)==(b|0)){k=b}else{do{k=k+ -12|0;Zd(h+ -12|0,k);h=h+ -12|0}while((k|0)!=(b|0));k=c[a>>2]|0;b=c[e>>2]|0}c[a>>2]=h;c[e>>2]=j;c[f>>2]=g;while(1){if((b|0)==(k|0)){break}l=b+ -12|0;Ud(l);b=l}if((k|0)==0){i=d;return}jr(k);i=d;return}function Yg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;i=i+32|0;f=d+24|0;g=d+16|0;h=d+8|0;e=a+8|0;if(!(c[e>>2]<<5>>>0<b>>>0)){i=d;return}if((b|0)<0){io(0)}j=((b+ -1|0)>>>5)+1|0;n=hr(j<<2)|0;b=c[a>>2]|0;k=a+4|0;l=c[k>>2]|0;m=l>>>5;l=l&31;c[f>>2]=b;c[f+4>>2]=0;c[g>>2]=b+(m<<2);c[g+4>>2]=l;c[h>>2]=n;c[h+4>>2]=0;Zg(d,f,g,h);b=c[a>>2]|0;c[a>>2]=n;c[k>>2]=m<<5|l;c[e>>2]=j;if((b|0)==0){i=d;return}jr(b);i=d;return}function Zg(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;h=c[b>>2]|0;g=c[b+4>>2]|0;d=(c[d+4>>2]|0)-g+((c[d>>2]|0)-h<<3)|0;if((d|0)<=0){j=c[e>>2]|0;c[a>>2]=j;j=a+4|0;d=e+4|0;d=c[d>>2]|0;c[j>>2]=d;i=f;return}if((g|0)==0){g=e;j=d}else{j=32-g|0;k=(d|0)<(j|0)?d:j;g=-1>>>(j-k|0)&-1<<g;j=c[e>>2]|0;c[j>>2]=c[j>>2]&~g|c[h>>2]&g;h=e+4|0;g=(c[h>>2]|0)+k|0;c[e>>2]=j+(g>>>5<<2);c[h>>2]=g&31;h=(c[b>>2]|0)+4|0;c[b>>2]=h;g=e;j=d-k|0}d=j>>>5;Gr(c[g>>2]|0,h|0,d<<2|0)|0;j=j-(d<<5)|0;h=(c[g>>2]|0)+(d<<2)|0;c[g>>2]=h;if((j|0)<=0){k=h;c[a>>2]=k;k=a+4|0;j=e+4|0;j=c[j>>2]|0;c[k>>2]=j;i=f;return}h=(c[b>>2]|0)+(d<<2)|0;c[b>>2]=h;d=-1>>>(32-j|0);k=c[g>>2]|0;c[k>>2]=c[k>>2]&~d|c[h>>2]&d;c[e+4>>2]=j;c[a>>2]=k;k=a+4|0;j=e+4|0;j=c[j>>2]|0;c[k>>2]=j;i=f;return}function _g(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;f=a+8|0;d=a+4|0;g=c[d>>2]|0;m=c[f>>2]|0;h=g;if(!(m-h>>2>>>0<b>>>0)){f=b;a=g;while(1){if((a|0)!=0){c[a>>2]=0}f=f+ -1|0;if((f|0)==0){break}else{a=a+4|0}}c[d>>2]=g+(b<<2);i=e;return}g=c[a>>2]|0;n=g;h=h-n|0;l=h>>2;j=l+b|0;if(j>>>0>1073741823){io(0)}m=m-n|0;if(m>>2>>>0<536870911){m=m>>1;n=m>>>0<j>>>0?j:m;if((n|0)==0){m=0;n=0}else{k=10}}else{n=1073741823;k=10}if((k|0)==10){m=n;n=hr(n<<2)|0}k=n+(l<<2)|0;while(1){if((k|0)!=0){c[k>>2]=0}b=b+ -1|0;if((b|0)==0){break}else{k=k+4|0}}Fr(n|0,g|0,h|0)|0;c[a>>2]=n;c[d>>2]=n+(j<<2);c[f>>2]=n+(m<<2);if((g|0)==0){i=e;return}jr(g);i=e;return}function $g(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=i;f=a+8|0;e=a+4|0;h=c[e>>2]|0;k=c[f>>2]|0;g=h;if(!(((k-g|0)/12|0)>>>0<b>>>0)){do{if((h|0)==0){f=0}else{c[h>>2]=0;c[h+4>>2]=0;c[h+8>>2]=0;f=c[e>>2]|0}h=f+12|0;c[e>>2]=h;b=b+ -1|0}while((b|0)!=0);i=d;return}l=c[a>>2]|0;g=(g-l|0)/12|0;h=g+b|0;if(h>>>0>357913941){io(0)}k=(k-l|0)/12|0;if(k>>>0<178956970){k=k<<1;h=k>>>0<h>>>0?h:k;if((h|0)==0){l=0;h=0}else{j=9}}else{h=357913941;j=9}if((j|0)==9){l=h;h=hr(h*12|0)|0}k=h+(g*12|0)|0;j=k;do{if((j|0)==0){j=0}else{c[j>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0}j=j+12|0;b=b+ -1|0}while((b|0)!=0);b=h+(l*12|0)|0;l=c[a>>2]|0;m=c[e>>2]|0;if((m|0)!=(l|0)){g=g+ -1-(((m+ -12+(0-l)|0)>>>0)/12|0)|0;while(1){n=m+ -12|0;o=k+ -12|0;c[o>>2]=0;q=k+ -8|0;c[q>>2]=0;p=k+ -4|0;c[p>>2]=0;c[o>>2]=c[n>>2];o=m+ -8|0;c[q>>2]=c[o>>2];m=m+ -4|0;c[p>>2]=c[m>>2];c[m>>2]=0;c[o>>2]=0;c[n>>2]=0;if((n|0)==(l|0)){break}else{m=n;k=k+ -12|0}}k=c[a>>2]|0;l=c[e>>2]|0;c[a>>2]=h+(g*12|0);c[e>>2]=j;c[f>>2]=b;if((l|0)!=(k|0)){while(1){e=l+ -12|0;f=c[e>>2]|0;if((f|0)!=0){a=l+ -8|0;g=c[a>>2]|0;if((g|0)!=(f|0)){c[a>>2]=g+(~((g+ -4+(0-f)|0)>>>2)<<2)}jr(f)}if((e|0)==(k|0)){break}else{l=e}}}}else{c[a>>2]=k;c[e>>2]=j;c[f>>2]=b;k=l}if((k|0)==0){i=d;return}jr(k);i=d;return}function ah(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;m=c[b>>2]|0;h=c[m+ -12>>2]|0;j=c[b+(h+16)>>2]|0;if((j|0)!=0){fj(b+h|0,j|4);i=g;return b|0}j=c[b+(h+72)>>2]|0;if((j|0)!=0){Pj(j)|0;m=c[b>>2]|0;h=c[m+ -12>>2]|0}if((c[b+(h+16)>>2]|0)!=0){i=g;return b|0}if((a[e]&1)==0){h=e+1|0;a[h]=0;a[e]=0;j=e+8|0;k=e+4|0}else{j=e+8|0;a[c[j>>2]|0]=0;k=e+4|0;c[k>>2]=0;h=e+1|0}l=0;while(1){n=c[b+((c[m+ -12>>2]|0)+24)>>2]|0;o=n+12|0;m=c[o>>2]|0;if((m|0)==(c[n+16>>2]|0)){m=sc[c[(c[n>>2]|0)+40>>2]&127](n)|0;if((m|0)==-1){e=2;break}}else{c[o>>2]=m+1;m=d[m]|0}l=l+1|0;m=m&255;if(m<<24>>24==f<<24>>24){e=0;break}n=a[e]|0;o=(n&1)!=0;if(o){p=(c[e>>2]&-2)+ -1|0;n=c[k>>2]|0}else{p=10;n=(n&255)>>>1}if((n|0)==(p|0)){Xi(e,p,1,p,p,0,0);if((a[e]&1)==0){q=21}else{q=22}}else{if(o){q=22}else{q=21}}if((q|0)==21){a[e]=(n<<1)+2;p=h;o=n+1|0}else if((q|0)==22){p=c[j>>2]|0;o=n+1|0;c[k>>2]=o}a[p+n|0]=m;a[p+o|0]=0;if(!((a[e]&1)==0)?(c[k>>2]|0)==-17:0){e=4;break}m=c[b>>2]|0}q=c[(c[b>>2]|0)+ -12>>2]|0;fj(b+q|0,c[b+(q+16)>>2]|((l|0)==0?e|4:e));i=g;return b|0}function bh(b){b=b|0;var d=0,e=0;d=i;c[b>>2]=14092;c[b+60>>2]=14112;e=b+8|0;c[e>>2]=14256;if(!((a[b+40|0]&1)==0)){jr(c[b+48>>2]|0)}c[e>>2]=24784;ro(b+12|0);gj(b+60|0);jr(b);i=d;return}function ch(b){b=b|0;var d=0,e=0,f=0,g=0;d=i;f=c[(c[b>>2]|0)+ -12>>2]|0;c[b+f>>2]=14092;e=b+(f+60)|0;c[e>>2]=14112;g=b+(f+8)|0;c[g>>2]=14256;if(!((a[b+(f+40)|0]&1)==0)){jr(c[b+(f+48)>>2]|0)}c[g>>2]=24784;ro(b+(f+12)|0);gj(e);i=d;return}function dh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;g=c[(c[b>>2]|0)+ -12>>2]|0;e=b+g|0;c[e>>2]=14092;f=b+(g+60)|0;c[f>>2]=14112;h=b+(g+8)|0;c[h>>2]=14256;if(!((a[b+(g+40)|0]&1)==0)){jr(c[b+(g+48)>>2]|0)}c[h>>2]=24784;ro(b+(g+12)|0);gj(f);jr(e);i=d;return}function eh(b){b=b|0;var d=0;d=i;c[b>>2]=14256;if(!((a[b+32|0]&1)==0)){jr(c[b+40>>2]|0)}c[b>>2]=24784;ro(b+4|0);i=d;return}function fh(b){b=b|0;var d=0;d=i;c[b>>2]=14256;if(!((a[b+32|0]&1)==0)){jr(c[b+40>>2]|0)}c[b>>2]=24784;ro(b+4|0);jr(b);i=d;return}function gh(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0;l=i;o=d+44|0;m=c[o>>2]|0;k=d+24|0;j=c[k>>2]|0;if(m>>>0<j>>>0){c[o>>2]=j;m=j}o=h&24;do{if((o|0)==24){if((g|0)==0){g=0;o=0;break}else if((g|0)==2){n=11;break}else if((g|0)!=1){n=15;break}o=b;c[o>>2]=0;c[o+4>>2]=0;o=b+8|0;c[o>>2]=-1;c[o+4>>2]=-1;i=l;return}else if((o|0)!=0){if((g|0)==0){g=0;o=0;break}else if((g|0)==2){n=11;break}else if((g|0)!=1){n=15;break}if((h&8|0)==0){o=j-(c[d+20>>2]|0)|0;g=o;o=((o|0)<0)<<31>>31;break}else{o=(c[d+12>>2]|0)-(c[d+8>>2]|0)|0;g=o;o=((o|0)<0)<<31>>31;break}}else{o=b;c[o>>2]=0;c[o+4>>2]=0;o=b+8|0;c[o>>2]=-1;c[o+4>>2]=-1;i=l;return}}while(0);if((n|0)==15){o=b;c[o>>2]=0;c[o+4>>2]=0;o=b+8|0;c[o>>2]=-1;c[o+4>>2]=-1;i=l;return}if((n|0)==11){n=d+32|0;if((a[n]&1)==0){n=n+1|0}else{n=c[d+40>>2]|0}o=m-n|0;g=o;o=((o|0)<0)<<31>>31}f=Br(g|0,o|0,e|0,f|0)|0;e=I;if((e|0)>=0){n=d+32|0;if((a[n]&1)==0){n=n+1|0}else{n=c[d+40>>2]|0}o=m-n|0;g=((o|0)<0)<<31>>31;if(!((g|0)<(e|0)|(g|0)==(e|0)&o>>>0<f>>>0)){n=h&8;if(!((f|0)==0&(e|0)==0)){if((n|0)!=0?(c[d+12>>2]|0)==0:0){o=b;c[o>>2]=0;c[o+4>>2]=0;o=b+8|0;c[o>>2]=-1;c[o+4>>2]=-1;i=l;return}if((h&16|0)!=0&(j|0)==0){o=b;c[o>>2]=0;c[o+4>>2]=0;o=b+8|0;c[o>>2]=-1;c[o+4>>2]=-1;i=l;return}}if((n|0)!=0){c[d+12>>2]=(c[d+8>>2]|0)+f;c[d+16>>2]=m}if((h&16|0)!=0){c[k>>2]=(c[d+20>>2]|0)+f}o=b;c[o>>2]=0;c[o+4>>2]=0;o=b+8|0;c[o>>2]=f;c[o+4>>2]=e;i=l;return}}o=b;c[o>>2]=0;c[o+4>>2]=0;o=b+8|0;c[o>>2]=-1;c[o+4>>2]=-1;i=l;return}function hh(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=i;d=d+8|0;Ac[c[(c[b>>2]|0)+16>>2]&31](a,b,c[d>>2]|0,c[d+4>>2]|0,0,e);i=f;return}function ih(a){a=a|0;var b=0,e=0,f=0,g=0;b=i;f=a+44|0;g=c[f>>2]|0;e=c[a+24>>2]|0;if(g>>>0<e>>>0){c[f>>2]=e}else{e=g}if((c[a+48>>2]&8|0)==0){g=-1;i=b;return g|0}f=a+16|0;g=c[f>>2]|0;a=c[a+12>>2]|0;if(g>>>0<e>>>0){c[f>>2]=e}else{e=g}if(!(a>>>0<e>>>0)){g=-1;i=b;return g|0}g=d[a]|0;i=b;return g|0}function jh(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;g=b+44|0;f=c[g>>2]|0;j=c[b+24>>2]|0;if(f>>>0<j>>>0){c[g>>2]=j}else{j=f}f=b+8|0;g=c[f>>2]|0;h=b+12|0;l=c[h>>2]|0;if(!(g>>>0<l>>>0)){l=-1;i=e;return l|0}if((d|0)==-1){c[f>>2]=g;c[h>>2]=l+ -1;c[b+16>>2]=j;l=0;i=e;return l|0}if((c[b+48>>2]&16|0)==0){k=d&255;l=l+ -1|0;if(!(k<<24>>24==(a[l]|0))){l=-1;i=e;return l|0}}else{k=d&255;l=l+ -1|0}c[f>>2]=g;c[h>>2]=l;c[b+16>>2]=j;a[l]=k;l=d;i=e;return l|0}function kh(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;if((d|0)==-1){u=0;i=j;return u|0}g=b+12|0;e=b+8|0;f=(c[g>>2]|0)-(c[e>>2]|0)|0;h=b+24|0;n=c[h>>2]|0;k=b+28|0;m=c[k>>2]|0;if((n|0)==(m|0)){l=b+48|0;if((c[l>>2]&16|0)==0){u=-1;i=j;return u|0}m=b+20|0;p=c[m>>2]|0;o=n-p|0;n=b+44|0;p=(c[n>>2]|0)-p|0;q=b+32|0;r=a[q]|0;t=(r&1)!=0;if(t){s=(c[q>>2]&-2)+ -1|0;r=c[b+36>>2]|0}else{s=10;r=(r&255)>>>1}if((r|0)==(s|0)){Xi(q,s,1,s,s,0,0);if((a[q]&1)==0){s=11}else{s=12}}else{if(t){s=12}else{s=11}}if((s|0)==11){a[q]=(r<<1)+2;u=q+1|0;t=r+1|0}else if((s|0)==12){u=c[b+40>>2]|0;t=r+1|0;c[b+36>>2]=t}a[u+r|0]=0;a[u+t|0]=0;t=a[q]|0;if((t&1)==0){r=10}else{r=c[q>>2]|0;t=r&255;r=(r&-2)+ -1|0}s=(t&1)==0;if(s){t=(t&255)>>>1}else{t=c[b+36>>2]|0}do{if(!(t>>>0<r>>>0)){if(s){a[q+r+1|0]=0;a[q]=r<<1;break}else{a[(c[b+40>>2]|0)+r|0]=0;c[b+36>>2]=r;break}}else{Si(q,r-t|0,0)|0}}while(0);r=a[q]|0;if((r&1)==0){q=q+1|0;r=(r&255)>>>1}else{q=c[b+40>>2]|0;r=c[b+36>>2]|0}t=q+r|0;c[m>>2]=q;c[k>>2]=t;u=q+o|0;c[h>>2]=u;o=q+p|0;c[n>>2]=o;k=t;n=u}else{l=b+48|0;k=m;o=c[b+44>>2]|0}m=n+1|0;o=m>>>0<o>>>0?o:m;c[b+44>>2]=o;if((c[l>>2]&8|0)!=0){l=b+32|0;if((a[l]&1)==0){l=l+1|0}else{l=c[b+40>>2]|0}c[e>>2]=l;c[g>>2]=l+f;c[b+16>>2]=o}if((n|0)==(k|0)){u=Bc[c[(c[b>>2]|0)+52>>2]&31](b,d&255)|0;i=j;return u|0}else{c[h>>2]=m;a[n]=d;u=d&255;i=j;return u|0}return 0}function lh(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=b+32|0;Pi(f,d)|0;g=b+44|0;c[g>>2]=0;d=b+48|0;h=c[d>>2]|0;if((h&8|0)!=0){j=a[f]|0;if((j&1)==0){l=f+((j&255)>>>1)+1|0;c[g>>2]=l;k=f+1|0;j=f+1|0}else{l=(c[b+40>>2]|0)+(c[b+36>>2]|0)|0;c[g>>2]=l;j=c[b+40>>2]|0;k=j}c[b+8>>2]=k;c[b+12>>2]=j;c[b+16>>2]=l}if((h&16|0)==0){i=e;return}k=a[f]|0;if((k&1)==0){l=(k&255)>>>1;c[g>>2]=f+l+1;h=10;g=l}else{l=c[b+36>>2]|0;c[g>>2]=(c[b+40>>2]|0)+l;h=c[f>>2]|0;k=h&255;h=(h&-2)+ -1|0;g=l}j=(k&1)==0;if(j){k=(k&255)>>>1}else{k=c[b+36>>2]|0}do{if(!(k>>>0<h>>>0)){if(j){a[f+h+1|0]=0;a[f]=h<<1;break}else{a[(c[b+40>>2]|0)+h|0]=0;c[b+36>>2]=h;break}}else{Si(f,h-k|0,0)|0}}while(0);j=a[f]|0;if((j&1)==0){h=f+1|0;j=(j&255)>>>1;k=f+1|0}else{k=c[b+40>>2]|0;h=k;j=c[b+36>>2]|0}f=b+24|0;c[f>>2]=k;c[b+20>>2]=k;c[b+28>>2]=h+j;if((c[d>>2]&3|0)==0){i=e;return}c[f>>2]=k+g;i=e;return}function mh(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;f=b+4|0;p=c[f>>2]|0;h=c[b>>2]|0;k=h;l=(p-k|0)/12|0;n=l+1|0;if(n>>>0>357913941){io(0)}g=b+8|0;j=((c[g>>2]|0)-k|0)/12|0;if(j>>>0<178956970){j=j<<1;j=j>>>0<n>>>0?n:j;if((j|0)==0){q=0;j=0}else{m=5}}else{j=357913941;m=5}if((m|0)==5){q=j;j=hr(j*12|0)|0}o=j+(l*12|0)|0;m=j+(q*12|0)|0;do{if((o|0)!=0){if((a[d]&1)==0){c[o+0>>2]=c[d+0>>2];c[o+4>>2]=c[d+4>>2];c[o+8>>2]=c[d+8>>2];break}p=c[d+8>>2]|0;d=c[d+4>>2]|0;if(d>>>0>4294967279){Ii(0)}if(d>>>0<11){a[o]=d<<1;q=o+1|0}else{r=d+16&-16;q=hr(r)|0;c[j+(l*12|0)+8>>2]=q;c[o>>2]=r|1;c[j+(l*12|0)+4>>2]=d}Fr(q|0,p|0,d|0)|0;a[q+d|0]=0;p=c[f>>2]|0}}while(0);n=j+(n*12|0)|0;if((p|0)!=(h|0)){k=l+ -1-(((p+ -12+(0-k)|0)>>>0)/12|0)|0;do{o=o+ -12|0;p=p+ -12|0;c[o+0>>2]=c[p+0>>2];c[o+4>>2]=c[p+4>>2];c[o+8>>2]=c[p+8>>2];c[p+0>>2]=0;c[p+4>>2]=0;c[p+8>>2]=0}while((p|0)!=(h|0));h=c[b>>2]|0;l=c[f>>2]|0;c[b>>2]=j+(k*12|0);c[f>>2]=n;c[g>>2]=m;if((l|0)!=(h|0)){while(1){b=l+ -12|0;if(!((a[b]&1)==0)){jr(c[l+ -4>>2]|0)}if((b|0)==(h|0)){break}else{l=b}}}}else{c[b>>2]=o;c[f>>2]=n;c[g>>2]=m}if((h|0)==0){i=e;return}jr(h);i=e;return}function nh(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0.0;b=i;i=i+80|0;q=b+64|0;o=b+52|0;m=b+40|0;l=b+28|0;n=b+16|0;p=b+8|0;k=b;x=a[d]|0;if((x&1)==0){s=(x&255)>>>1}else{s=c[d+4>>2]|0}if((s|0)!=32){x=0;i=b;return x|0}s=d+1|0;t=d+8|0;u=d+4|0;v=0;while(1){w=(x&1)==0;if(w){x=(x&255)>>>1}else{x=c[u>>2]|0}if(!(v>>>0<x>>>0)){break}if(w){w=s}else{w=c[t>>2]|0}if((Fb(a[w+v|0]|0)|0)==0){f=0;r=19;break}x=a[d]|0;v=v+1|0}if((r|0)==19){i=b;return f|0}r=h>>>1;Yd(q);Yd(o);uh(g,h,0,r+ -1|0,q)|0;uh(g,h,r,h+ -1|0,o)|0;s=h-r|0;_d(m,0);_d(l,0);_d(n,0);y=+(h>>>0)*.5;g=0;do{if((g&1|0)==0){t=r}else{t=~~+da(+y)>>>0}ne(n,2,t);oh(d,h,e,f,g,o,l);Pd(m,q,l);me(m,m,n);fe(q,o);fe(o,m);g=g+1|0}while(g>>>0<10);c[k>>2]=q;c[k+4>>2]=s;c[p>>2]=k;c[p+4>>2]=o;sh(p,j);ne(n,2,h);me(j,j,n);Ud(n);Ud(l);Ud(m);Ud(o);Ud(q);x=1;i=b;return x|0}function oh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;l=i;i=i+352|0;u=l+344|0;k=l+328|0;t=l+320|0;S=l+304|0;w=l+296|0;v=l+280|0;y=l+272|0;x=l+256|0;A=l+248|0;z=l+232|0;C=l+224|0;B=l+208|0;F=l+200|0;D=l+184|0;H=l+176|0;G=l+164|0;o=l+152|0;L=l+144|0;K=l+128|0;N=l+120|0;M=l+104|0;r=l+92|0;Q=l+80|0;P=l+72|0;O=l+64|0;m=l+48|0;j=l+36|0;p=l+24|0;q=l+12|0;n=l;I=~~+da(+(+(e>>>0)*.125))>>>0;s=~~+da(+(+(b>>>0)*.5))>>>0;J=~~+da(+(+(s>>>0)*.125))>>>0;R=~~(+da(+(+(J>>>0)*.25))*4.0)>>>0;E=b>>>1;s=(f&1|0)==0?E:s;_d(k,0);ae(S,1);c[t>>2]=S;c[t+4>>2]=120;c[u>>2]=k;c[u+4>>2]=t;th(u,k);Ud(S);_d(v,2);c[w>>2]=v;c[w+4>>2]=112;c[u>>2]=k;c[u+4>>2]=w;th(u,k);Ud(v);_d(x,1);c[y>>2]=x;c[y+4>>2]=104;c[u>>2]=k;c[u+4>>2]=y;th(u,k);Ud(x);_d(z,2);c[A>>2]=z;c[A+4>>2]=80;c[u>>2]=k;c[u+4>>2]=A;th(u,k);Ud(z);_d(B,10);c[C>>2]=B;c[C+4>>2]=72;c[u>>2]=k;c[u+4>>2]=C;th(u,k);Ud(B);ae(D,E);c[F>>2]=D;c[F+4>>2]=64;c[u>>2]=k;c[u+4>>2]=F;th(u,k);Ud(D);ae(G,b);c[H>>2]=G;c[H+4>>2]=32;c[u>>2]=k;c[u+4>>2]=H;th(u,k);Ud(G);Qd(k,k,I);b=J<<3;_d(o,0);S=b+8+((0-(J+I)<<3)+120&120)|0;e=S+e|0;Zd(K,d);c[L>>2]=K;c[L+4>>2]=S;c[u>>2]=o;c[u+4>>2]=L;th(u,o);Ud(K);ae(M,f);c[N>>2]=M;c[N+4>>2]=b;c[u>>2]=o;c[u+4>>2]=N;th(u,o);Ud(M);Pd(o,o,g);_d(r,0);c[O>>2]=k;c[O+4>>2]=e;c[P>>2]=O;c[P+4>>2]=o;Yd(Q);sh(P,Q);g=yh(a,Q,e+128|0,r)|0;Ud(Q);if(!g){Ud(r);Ud(o);Ud(k);i=l;return}Zd(m,r);_d(j,1);u=R+4|0;t=16;while(1){if(!(t>>>0<u>>>0)){break}Yd(p);Yd(q);Pd(q,r,j);zh(a,q,128,p)|0;Ud(q);be(m,m,128);Pd(m,m,p);Qd(j,j,1);Ud(p);t=t+16|0}uh(m,t<<3,0,(u<<3)+ -1|0,r)|0;_d(n,0);ne(n,2,s);me(r,r,n);fe(h,r);Ud(n);Ud(j);Ud(m);Ud(r);Ud(o);Ud(k);i=l;return}function ph(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0.0;b=i;i=i+80|0;q=b+64|0;o=b+52|0;m=b+40|0;l=b+28|0;n=b+16|0;p=b+8|0;k=b;x=a[d]|0;if((x&1)==0){s=(x&255)>>>1}else{s=c[d+4>>2]|0}if((s|0)!=32){x=0;i=b;return x|0}s=d+1|0;t=d+8|0;u=d+4|0;v=0;while(1){w=(x&1)==0;if(w){x=(x&255)>>>1}else{x=c[u>>2]|0}if(!(v>>>0<x>>>0)){break}if(w){w=s}else{w=c[t>>2]|0}if((Fb(a[w+v|0]|0)|0)==0){f=0;r=22;break}x=a[d]|0;v=v+1|0}if((r|0)==22){i=b;return f|0}r=h>>>1;Yd(q);Yd(o);uh(g,h,0,r+ -1|0,q)|0;uh(g,h,r,h+ -1|0,o)|0;s=h-r|0;_d(m,0);_d(l,0);_d(n,0);y=+(h>>>0)*.5;g=9;while(1){if((g&1|0)==0){t=r}else{t=~~+da(+y)>>>0}ne(n,2,t);fe(m,o);fe(o,q);oh(d,h,e,f,g,o,l);je(q,m,l);while(1){if((Wd(q,0)|0)>=0){break}Pd(q,q,n)}me(q,q,n);if((g|0)>0){g=g+ -1|0}else{break}}c[k>>2]=q;c[k+4>>2]=s;c[p>>2]=k;c[p+4>>2]=o;sh(p,j);ne(n,2,h);me(j,j,n);Ud(n);Ud(l);Ud(m);Ud(o);Ud(q);x=1;i=b;return x|0}function qh(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+16|0;g=f;_d(g,0);a=nh(0,b,g,0,c,d,e)|0;Ud(g);i=f;return a|0}function rh(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+16|0;g=f;_d(g,0);a=ph(0,b,g,0,c,d,e)|0;Ud(g);i=f;return a|0}function sh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d;f=a+4|0;a=c[a>>2]|0;if((c[f>>2]|0)==(b|0)){Yd(e);be(e,c[a>>2]|0,c[a+4>>2]|0);Pd(b,e,c[f>>2]|0);Ud(e);i=d;return}else{be(b,c[a>>2]|0,c[a+4>>2]|0);Pd(b,b,c[f>>2]|0);i=d;return}}function th(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d;f=c[a+4>>2]|0;if((c[a>>2]|0)==(b|0)){Yd(e);be(e,c[f>>2]|0,c[f+4>>2]|0);Pd(b,c[a>>2]|0,e);Ud(e);i=d;return}else{be(b,c[f>>2]|0,c[f+4>>2]|0);Pd(b,c[a>>2]|0,b);i=d;return}}function uh(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+16|0;g=f;fe(e,a);Td(e,e,b+ -1-d|0);Yd(g);ne(g,2,1-c+d|0);me(e,e,g);Ud(g);i=f;return 1}function vh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+48|0;k=f+28|0;h=f+24|0;j=f+12|0;g=f;Zd(j,b);b=k+8|0;l=k+4|0;m=g+8|0;n=g+4|0;while(1){d=d+ -1|0;if(!((d|0)>-1)){break}Yd(g);c[b>>2]=h;c[l>>2]=1;c[h>>2]=255;Rd(g,j,k);a[e+d|0]=(c[n>>2]|0)!=0?c[c[m>>2]>>2]&255:0;Td(j,j,8);Ud(g)}Ud(j);i=f;return 1}function wh(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;j=i;i=i+32|0;h=j+24|0;f=j+8|0;g=j;ge(e,0);if((b|0)==0){i=j;return 1}k=b+536870911|0;l=g+4|0;m=h+4|0;n=0;do{ae(f,d[a+n|0]|0);c[g>>2]=f;c[l>>2]=k-n<<3;c[h>>2]=e;c[m>>2]=g;th(h,e);Ud(f);n=n+1|0}while(n>>>0<b>>>0);i=j;return 1}function xh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+32|0;j=g+12|0;f=g;if((d|0)==0){i=g;return 1}m=j+1|0;k=f+8|0;l=f+4|0;h=j+8|0;n=0;while(1){Ni(j,b,n<<1,2,0);if(($d(f,(a[j]&1)==0?m:c[h>>2]|0,16)|0)!=0){h=4;break}a[e+n|0]=(c[l>>2]|0)!=0?c[c[k>>2]>>2]&255:0;Ud(f);if(!((a[j]&1)==0)){jr(c[h>>2]|0)}n=n+1|0;if(!(n>>>0<d>>>0)){h=8;break}}if((h|0)==4){Ud(f);n=wb(8)|0;mi(n,14400);c[n>>2]=24312;ec(n|0,24352,21)}else if((h|0)==8){i=g;return 1}return 0}function yh(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;e=(e+7|0)>>>3;h=a[b]|0;if((h&1)==0){h=(h&255)>>>1}else{h=c[b+4>>2]|0}n=(h+1|0)>>>1;o=ir(244)|0;j=ir(n)|0;p=ir(n)|0;m=ir(e)|0;k=ir(e)|0;if((e|0)!=0){Hr(m|0,0,e|0)|0;Hr(k|0,0,e|0)|0}l=j+0|0;h=l+16|0;do{a[l]=0;l=l+1|0}while((l|0)<(h|0));l=p+0|0;h=l+16|0;do{a[l]=0;l=l+1|0}while((l|0)<(h|0));vh(d,e,m)|0;xh(b,n,p)|0;Dh(p,o)|0;Bh(m,k,e,j,o)|0;wh(k,e,f)|0;n=e<<3;uh(f,n,n+ -128|0,n+ -1|0,f)|0;if((o|0)!=0){kr(o)}if((j|0)!=0){kr(j)}if((p|0)!=0){kr(p)}if((m|0)!=0){kr(m)}if((k|0)==0){i=g;return 1}kr(k);i=g;return 1}function zh(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;e=(e+7|0)>>>3;h=a[b]|0;if((h&1)==0){h=(h&255)>>>1}else{h=c[b+4>>2]|0}j=(h+1|0)>>>1;h=ir(244)|0;k=ir(j)|0;m=ir(e)|0;l=ir(e)|0;if((e|0)!=0){Hr(m|0,0,e|0)|0;Hr(l|0,0,e|0)|0}if((j|0)!=0){Hr(k|0,0,j|0)|0}vh(d,e,m)|0;xh(b,16,k)|0;Dh(k,h)|0;Ah(m,l,e,h)|0;wh(l,e,f)|0;if((h|0)!=0){kr(h)}if((k|0)!=0){kr(k)}if((m|0)!=0){kr(m)}if((l|0)==0){i=g;return 1}kr(l);i=g;return 1}function Ah(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=i;f=c>>4;a:do{if((c&15|0)==0){if((f|0)==0){d=0}else{while(1){f=f+ -1|0;if((Ch(a,b,d)|0)!=0){d=1;break a}if((f|0)==0){d=0;break}else{a=a+16|0;b=b+16|0}}}}else{d=1}}while(0);i=e;return d|0}function Bh(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;h=i;j=e>>4;if((e&15|0)!=0){A=1;i=h;return A|0}if((b&3|0)==0?(f&3|0)==0:0){if((j|0)==0){A=0;i=h;return A|0}m=f+4|0;n=f+8|0;o=f+12|0;p=b;q=d;r=j;while(1){r=r+ -1|0;c[f>>2]=c[f>>2]^c[p>>2];c[m>>2]=c[m>>2]^c[p+4>>2];c[n>>2]=c[n>>2]^c[p+8>>2];c[o>>2]=c[o>>2]^c[p+12>>2];if((Ch(f,f,g)|0)!=0){k=1;e=12;break}l=q+0|0;k=f+0|0;e=l+16|0;do{a[l]=a[k]|0;l=l+1|0;k=k+1|0}while((l|0)<(e|0));if((r|0)==0){k=0;e=12;break}else{p=p+16|0;q=q+16|0}}if((e|0)==12){i=h;return k|0}}if((j|0)==0){A=0;i=h;return A|0}x=f+1|0;y=f+2|0;z=f+3|0;p=f+4|0;w=f+5|0;r=f+6|0;q=f+7|0;A=f+8|0;o=f+9|0;n=f+10|0;m=f+11|0;v=f+12|0;u=f+13|0;t=f+14|0;s=f+15|0;while(1){j=j+ -1|0;a[f]=a[f]^a[b];a[x]=a[x]^a[b+1|0];a[y]=a[y]^a[b+2|0];a[z]=a[z]^a[b+3|0];a[p]=a[p]^a[b+4|0];a[w]=a[w]^a[b+5|0];a[r]=a[r]^a[b+6|0];a[q]=a[q]^a[b+7|0];a[A]=a[A]^a[b+8|0];a[o]=a[o]^a[b+9|0];a[n]=a[n]^a[b+10|0];a[m]=a[m]^a[b+11|0];a[v]=a[v]^a[b+12|0];a[u]=a[u]^a[b+13|0];a[t]=a[t]^a[b+14|0];a[s]=a[s]^a[b+15|0];if((Ch(f,f,g)|0)!=0){k=1;e=12;break}l=d+0|0;k=f+0|0;e=l+16|0;do{a[l]=a[k]|0;l=l+1|0;k=k+1|0}while((l|0)<(e|0));if((j|0)==0){k=0;e=12;break}else{b=b+16|0;d=d+16|0}}if((e|0)==12){i=h;return k|0}return 0}function Ch(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=i;m=a[f+240|0]|0;if(!(m<<24>>24==-32|m<<24>>24==-64|m<<24>>24==-96)){m=1;i=h;return m|0}l=((d[b+2|0]|0)<<16|(d[b+3|0]|0)<<24|(d[b+1|0]|0)<<8|(d[b]|0))^c[f>>2];k=((d[b+6|0]|0)<<16|(d[b+7|0]|0)<<24|(d[b+5|0]|0)<<8|(d[b+4|0]|0))^c[f+4>>2];j=((d[b+10|0]|0)<<16|(d[b+11|0]|0)<<24|(d[b+9|0]|0)<<8|(d[b+8|0]|0))^c[f+8>>2];b=((d[b+14|0]|0)<<16|(d[b+15|0]|0)<<24|(d[b+13|0]|0)<<8|(d[b+12|0]|0))^c[f+12>>2];m=m&255;if((m|0)==224){o=c[14456+((l&255)<<2)>>2]^c[f+16>>2]^c[15480+((k>>>8&255)<<2)>>2]^c[16504+((j>>>16&255)<<2)>>2]^c[17528+(b>>>24<<2)>>2];n=c[14456+((k&255)<<2)>>2]^c[f+20>>2]^c[15480+((j>>>8&255)<<2)>>2]^c[16504+((b>>>16&255)<<2)>>2]^c[17528+(l>>>24<<2)>>2];m=c[14456+((j&255)<<2)>>2]^c[f+24>>2]^c[15480+((b>>>8&255)<<2)>>2]^c[16504+((l>>>16&255)<<2)>>2]^c[17528+(k>>>24<<2)>>2];b=c[14456+((b&255)<<2)>>2]^c[f+28>>2]^c[15480+((l>>>8&255)<<2)>>2]^c[16504+((k>>>16&255)<<2)>>2]^c[17528+(j>>>24<<2)>>2];g=f+32|0;l=c[14456+((o&255)<<2)>>2]^c[g>>2]^c[15480+((n>>>8&255)<<2)>>2]^c[16504+((m>>>16&255)<<2)>>2]^c[17528+(b>>>24<<2)>>2];k=c[14456+((n&255)<<2)>>2]^c[f+36>>2]^c[15480+((m>>>8&255)<<2)>>2]^c[16504+((b>>>16&255)<<2)>>2]^c[17528+(o>>>24<<2)>>2];j=c[14456+((m&255)<<2)>>2]^c[f+40>>2]^c[15480+((b>>>8&255)<<2)>>2]^c[16504+((o>>>16&255)<<2)>>2]^c[17528+(n>>>24<<2)>>2];b=c[14456+((b&255)<<2)>>2]^c[f+44>>2]^c[15480+((o>>>8&255)<<2)>>2]^c[16504+((n>>>16&255)<<2)>>2]^c[17528+(m>>>24<<2)>>2];f=g;g=4}else if((m|0)==160){g=5}else if((m|0)==192){g=4}if((g|0)==4){p=c[14456+((l&255)<<2)>>2]^c[f+16>>2]^c[15480+((k>>>8&255)<<2)>>2]^c[16504+((j>>>16&255)<<2)>>2]^c[17528+(b>>>24<<2)>>2];m=c[14456+((k&255)<<2)>>2]^c[f+20>>2]^c[15480+((j>>>8&255)<<2)>>2]^c[16504+((b>>>16&255)<<2)>>2]^c[17528+(l>>>24<<2)>>2];n=c[14456+((j&255)<<2)>>2]^c[f+24>>2]^c[15480+((b>>>8&255)<<2)>>2]^c[16504+((l>>>16&255)<<2)>>2]^c[17528+(k>>>24<<2)>>2];b=c[14456+((b&255)<<2)>>2]^c[f+28>>2]^c[15480+((l>>>8&255)<<2)>>2]^c[16504+((k>>>16&255)<<2)>>2]^c[17528+(j>>>24<<2)>>2];o=f+32|0;l=c[14456+((p&255)<<2)>>2]^c[o>>2]^c[15480+((m>>>8&255)<<2)>>2]^c[16504+((n>>>16&255)<<2)>>2]^c[17528+(b>>>24<<2)>>2];k=c[14456+((m&255)<<2)>>2]^c[f+36>>2]^c[15480+((n>>>8&255)<<2)>>2]^c[16504+((b>>>16&255)<<2)>>2]^c[17528+(p>>>24<<2)>>2];j=c[14456+((n&255)<<2)>>2]^c[f+40>>2]^c[15480+((b>>>8&255)<<2)>>2]^c[16504+((p>>>16&255)<<2)>>2]^c[17528+(m>>>24<<2)>>2];b=c[14456+((b&255)<<2)>>2]^c[f+44>>2]^c[15480+((p>>>8&255)<<2)>>2]^c[16504+((m>>>16&255)<<2)>>2]^c[17528+(n>>>24<<2)>>2];f=o;g=5}if((g|0)==5){m=c[14456+((l&255)<<2)>>2]^c[f+16>>2]^c[15480+((k>>>8&255)<<2)>>2]^c[16504+((j>>>16&255)<<2)>>2]^c[17528+(b>>>24<<2)>>2];o=c[14456+((k&255)<<2)>>2]^c[f+20>>2]^c[15480+((j>>>8&255)<<2)>>2]^c[16504+((b>>>16&255)<<2)>>2]^c[17528+(l>>>24<<2)>>2];p=c[14456+((j&255)<<2)>>2]^c[f+24>>2]^c[15480+((b>>>8&255)<<2)>>2]^c[16504+((l>>>16&255)<<2)>>2]^c[17528+(k>>>24<<2)>>2];j=c[14456+((b&255)<<2)>>2]^c[f+28>>2]^c[15480+((l>>>8&255)<<2)>>2]^c[16504+((k>>>16&255)<<2)>>2]^c[17528+(j>>>24<<2)>>2];l=c[14456+((m&255)<<2)>>2]^c[f+32>>2]^c[15480+((o>>>8&255)<<2)>>2]^c[16504+((p>>>16&255)<<2)>>2]^c[17528+(j>>>24<<2)>>2];k=c[14456+((o&255)<<2)>>2]^c[f+36>>2]^c[15480+((p>>>8&255)<<2)>>2]^c[16504+((j>>>16&255)<<2)>>2]^c[17528+(m>>>24<<2)>>2];n=c[14456+((p&255)<<2)>>2]^c[f+40>>2]^c[15480+((j>>>8&255)<<2)>>2]^c[16504+((m>>>16&255)<<2)>>2]^c[17528+(o>>>24<<2)>>2];j=c[14456+((j&255)<<2)>>2]^c[f+44>>2]^c[15480+((m>>>8&255)<<2)>>2]^c[16504+((o>>>16&255)<<2)>>2]^c[17528+(p>>>24<<2)>>2];p=c[14456+((l&255)<<2)>>2]^c[f+48>>2]^c[15480+((k>>>8&255)<<2)>>2]^c[16504+((n>>>16&255)<<2)>>2]^c[17528+(j>>>24<<2)>>2];o=c[14456+((k&255)<<2)>>2]^c[f+52>>2]^c[15480+((n>>>8&255)<<2)>>2]^c[16504+((j>>>16&255)<<2)>>2]^c[17528+(l>>>24<<2)>>2];b=c[14456+((n&255)<<2)>>2]^c[f+56>>2]^c[15480+((j>>>8&255)<<2)>>2]^c[16504+((l>>>16&255)<<2)>>2]^c[17528+(k>>>24<<2)>>2];n=c[14456+((j&255)<<2)>>2]^c[f+60>>2]^c[15480+((l>>>8&255)<<2)>>2]^c[16504+((k>>>16&255)<<2)>>2]^c[17528+(n>>>24<<2)>>2];k=c[14456+((p&255)<<2)>>2]^c[f+64>>2]^c[15480+((o>>>8&255)<<2)>>2]^c[16504+((b>>>16&255)<<2)>>2]^c[17528+(n>>>24<<2)>>2];l=c[14456+((o&255)<<2)>>2]^c[f+68>>2]^c[15480+((b>>>8&255)<<2)>>2]^c[16504+((n>>>16&255)<<2)>>2]^c[17528+(p>>>24<<2)>>2];j=c[14456+((b&255)<<2)>>2]^c[f+72>>2]^c[15480+((n>>>8&255)<<2)>>2]^c[16504+((p>>>16&255)<<2)>>2]^c[17528+(o>>>24<<2)>>2];b=c[14456+((n&255)<<2)>>2]^c[f+76>>2]^c[15480+((p>>>8&255)<<2)>>2]^c[16504+((o>>>16&255)<<2)>>2]^c[17528+(b>>>24<<2)>>2];o=c[14456+((k&255)<<2)>>2]^c[f+80>>2]^c[15480+((l>>>8&255)<<2)>>2]^c[16504+((j>>>16&255)<<2)>>2]^c[17528+(b>>>24<<2)>>2];p=c[14456+((l&255)<<2)>>2]^c[f+84>>2]^c[15480+((j>>>8&255)<<2)>>2]^c[16504+((b>>>16&255)<<2)>>2]^c[17528+(k>>>24<<2)>>2];n=c[14456+((j&255)<<2)>>2]^c[f+88>>2]^c[15480+((b>>>8&255)<<2)>>2]^c[16504+((k>>>16&255)<<2)>>2]^c[17528+(l>>>24<<2)>>2];j=c[14456+((b&255)<<2)>>2]^c[f+92>>2]^c[15480+((k>>>8&255)<<2)>>2]^c[16504+((l>>>16&255)<<2)>>2]^c[17528+(j>>>24<<2)>>2];l=c[14456+((o&255)<<2)>>2]^c[f+96>>2]^c[15480+((p>>>8&255)<<2)>>2]^c[16504+((n>>>16&255)<<2)>>2]^c[17528+(j>>>24<<2)>>2];k=c[14456+((p&255)<<2)>>2]^c[f+100>>2]^c[15480+((n>>>8&255)<<2)>>2]^c[16504+((j>>>16&255)<<2)>>2]^c[17528+(o>>>24<<2)>>2];b=c[14456+((n&255)<<2)>>2]^c[f+104>>2]^c[15480+((j>>>8&255)<<2)>>2]^c[16504+((o>>>16&255)<<2)>>2]^c[17528+(p>>>24<<2)>>2];n=c[14456+((j&255)<<2)>>2]^c[f+108>>2]^c[15480+((o>>>8&255)<<2)>>2]^c[16504+((p>>>16&255)<<2)>>2]^c[17528+(n>>>24<<2)>>2];p=c[14456+((l&255)<<2)>>2]^c[f+112>>2]^c[15480+((k>>>8&255)<<2)>>2]^c[16504+((b>>>16&255)<<2)>>2]^c[17528+(n>>>24<<2)>>2];o=c[14456+((k&255)<<2)>>2]^c[f+116>>2]^c[15480+((b>>>8&255)<<2)>>2]^c[16504+((n>>>16&255)<<2)>>2]^c[17528+(l>>>24<<2)>>2];j=c[14456+((b&255)<<2)>>2]^c[f+120>>2]^c[15480+((n>>>8&255)<<2)>>2]^c[16504+((l>>>16&255)<<2)>>2]^c[17528+(k>>>24<<2)>>2];b=c[14456+((n&255)<<2)>>2]^c[f+124>>2]^c[15480+((l>>>8&255)<<2)>>2]^c[16504+((k>>>16&255)<<2)>>2]^c[17528+(b>>>24<<2)>>2];k=c[14456+((p&255)<<2)>>2]^c[f+128>>2]^c[15480+((o>>>8&255)<<2)>>2]^c[16504+((j>>>16&255)<<2)>>2]^c[17528+(b>>>24<<2)>>2];l=c[14456+((o&255)<<2)>>2]^c[f+132>>2]^c[15480+((j>>>8&255)<<2)>>2]^c[16504+((b>>>16&255)<<2)>>2]^c[17528+(p>>>24<<2)>>2];n=c[14456+((j&255)<<2)>>2]^c[f+136>>2]^c[15480+((b>>>8&255)<<2)>>2]^c[16504+((p>>>16&255)<<2)>>2]^c[17528+(o>>>24<<2)>>2];j=c[14456+((b&255)<<2)>>2]^c[f+140>>2]^c[15480+((p>>>8&255)<<2)>>2]^c[16504+((o>>>16&255)<<2)>>2]^c[17528+(j>>>24<<2)>>2];o=c[14456+((k&255)<<2)>>2]^c[f+144>>2]^c[15480+((l>>>8&255)<<2)>>2]^c[16504+((n>>>16&255)<<2)>>2]^c[17528+(j>>>24<<2)>>2];p=c[14456+((l&255)<<2)>>2]^c[f+148>>2]^c[15480+((n>>>8&255)<<2)>>2]^c[16504+((j>>>16&255)<<2)>>2]^c[17528+(k>>>24<<2)>>2];b=c[14456+((n&255)<<2)>>2]^c[f+152>>2]^c[15480+((j>>>8&255)<<2)>>2]^c[16504+((k>>>16&255)<<2)>>2]^c[17528+(l>>>24<<2)>>2];n=c[14456+((j&255)<<2)>>2]^c[f+156>>2]^c[15480+((k>>>8&255)<<2)>>2]^c[16504+((l>>>16&255)<<2)>>2]^c[17528+(n>>>24<<2)>>2];l=c[18552+((o&255)<<2)>>2]^c[f+160>>2]^c[19576+((p>>>8&255)<<2)>>2]^c[20600+((b>>>16&255)<<2)>>2]^c[21624+(n>>>24<<2)>>2];k=c[18552+((p&255)<<2)>>2]^c[f+164>>2]^c[19576+((b>>>8&255)<<2)>>2]^c[20600+((n>>>16&255)<<2)>>2]^c[21624+(o>>>24<<2)>>2];j=c[18552+((b&255)<<2)>>2]^c[f+168>>2]^c[19576+((n>>>8&255)<<2)>>2]^c[20600+((o>>>16&255)<<2)>>2]^c[21624+(p>>>24<<2)>>2];b=c[18552+((n&255)<<2)>>2]^c[f+172>>2]^c[19576+((o>>>8&255)<<2)>>2]^c[20600+((p>>>16&255)<<2)>>2]^c[21624+(b>>>24<<2)>>2]}a[e]=l;a[e+1|0]=l>>>8;a[e+2|0]=l>>>16;a[e+3|0]=l>>>24;a[e+4|0]=k;a[e+5|0]=k>>>8;a[e+6|0]=k>>>16;a[e+7|0]=k>>>24;a[e+8|0]=j;a[e+9|0]=j>>>8;a[e+10|0]=j>>>16;a[e+11|0]=j>>>24;a[e+12|0]=b;a[e+13|0]=b>>>8;a[e+14|0]=b>>>16;a[e+15|0]=b>>>24;p=0;i=h;return p|0}function Dh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;k=(d[b+2|0]|0)<<16|(d[b+3|0]|0)<<24|(d[b+1|0]|0)<<8|(d[b]|0);c[e>>2]=k;f=(d[b+6|0]|0)<<16|(d[b+7|0]|0)<<24|(d[b+5|0]|0)<<8|(d[b+4|0]|0);c[e+4>>2]=f;g=(d[b+10|0]|0)<<16|(d[b+11|0]|0)<<24|(d[b+9|0]|0)<<8|(d[b+8|0]|0);c[e+8>>2]=g;h=d[b+15|0]|0;j=d[b+14|0]|0;l=d[b+13|0]|0;i=d[b+12|0]|0;b=j<<16|h<<24|l<<8|i;c[e+12>>2]=b;i=c[18552+(l<<2)>>2]^k^c[19576+(j<<2)>>2]^c[20600+(h<<2)>>2]^c[21624+(i<<2)>>2]^c[3604];c[e+16>>2]=i;h=i^f;c[e+20>>2]=h;g=h^g;c[e+24>>2]=g;h=g^b;c[e+28>>2]=h;h=c[19576+((h>>>16&255)<<2)>>2]^c[18552+((h>>>8&255)<<2)>>2]^c[20600+(h>>>24<<2)>>2]^c[21624+((h&255)<<2)>>2]^c[14420>>2];i=h^i;c[e+32>>2]=i;f=h^f;c[e+36>>2]=f;c[e+40>>2]=f^g;h=f^b;c[e+44>>2]=h;i=c[19576+((h>>>16&255)<<2)>>2]^c[18552+((h>>>8&255)<<2)>>2]^i^c[20600+(h>>>24<<2)>>2]^c[21624+((h&255)<<2)>>2]^c[14424>>2];c[e+48>>2]=i;c[e+52>>2]=i^f;g=i^g;c[e+56>>2]=g;h=g^h;c[e+60>>2]=h;h=c[19576+((h>>>16&255)<<2)>>2]^c[18552+((h>>>8&255)<<2)>>2]^c[20600+(h>>>24<<2)>>2]^c[21624+((h&255)<<2)>>2]^c[14428>>2];i=h^i;c[e+64>>2]=i;f=h^f;c[e+68>>2]=f;c[e+72>>2]=f^g;b=h^b;c[e+76>>2]=b;i=c[19576+((b>>>16&255)<<2)>>2]^c[18552+((b>>>8&255)<<2)>>2]^i^c[20600+(b>>>24<<2)>>2]^c[21624+((b&255)<<2)>>2]^c[14432>>2];c[e+80>>2]=i;c[e+84>>2]=i^f;g=i^g;c[e+88>>2]=g;h=g^b;c[e+92>>2]=h;h=c[19576+((h>>>16&255)<<2)>>2]^c[18552+((h>>>8&255)<<2)>>2]^c[20600+(h>>>24<<2)>>2]^c[21624+((h&255)<<2)>>2]^c[14436>>2];i=h^i;c[e+96>>2]=i;f=h^f;c[e+100>>2]=f;c[e+104>>2]=f^g;h=f^b;c[e+108>>2]=h;i=c[19576+((h>>>16&255)<<2)>>2]^c[18552+((h>>>8&255)<<2)>>2]^i^c[20600+(h>>>24<<2)>>2]^c[21624+((h&255)<<2)>>2]^c[14440>>2];c[e+112>>2]=i;c[e+116>>2]=i^f;g=i^g;c[e+120>>2]=g;h=g^h;c[e+124>>2]=h;h=c[19576+((h>>>16&255)<<2)>>2]^c[18552+((h>>>8&255)<<2)>>2]^c[20600+(h>>>24<<2)>>2]^c[21624+((h&255)<<2)>>2]^c[14444>>2];i=h^i;c[e+128>>2]=i;f=h^f;c[e+132>>2]=f;c[e+136>>2]=f^g;b=h^b;c[e+140>>2]=b;i=c[19576+((b>>>16&255)<<2)>>2]^c[18552+((b>>>8&255)<<2)>>2]^i^c[20600+(b>>>24<<2)>>2]^c[21624+((b&255)<<2)>>2]^c[14448>>2];c[e+144>>2]=i;c[e+148>>2]=i^f;g=i^g;c[e+152>>2]=g;h=g^b;c[e+156>>2]=h;h=c[19576+((h>>>16&255)<<2)>>2]^c[18552+((h>>>8&255)<<2)>>2]^c[20600+(h>>>24<<2)>>2]^c[21624+((h&255)<<2)>>2]^c[14452>>2];c[e+160>>2]=h^i;f=h^f;c[e+164>>2]=f;c[e+168>>2]=f^g;c[e+172>>2]=f^b;b=e+240|0;c[b>>2]=0;a[b]=-96;return 0}function Eh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;e=i;a:while(1){k=b;f=b+ -4|0;b:while(1){l=a;o=k-l|0;n=o>>2;switch(n|0){case 4:{j=14;break a};case 1:case 0:{j=84;break a};case 3:{j=6;break a};case 5:{j=26;break a};case 2:{j=4;break a};default:{}}if((o|0)<124){j=28;break a}p=(n|0)/2|0;m=a+(p<<2)|0;do{if((o|0)<=3996){o=c[m>>2]|0;n=c[a>>2]|0;q=c[f>>2]|0;p=q>>>0<o>>>0;if(!(o>>>0<n>>>0)){if(!p){p=0;break}c[m>>2]=q;c[f>>2]=o;n=c[m>>2]|0;o=c[a>>2]|0;if(!(n>>>0<o>>>0)){p=1;break}c[a>>2]=n;c[m>>2]=o;p=2;break}if(p){c[a>>2]=q;c[f>>2]=n;p=1;break}c[a>>2]=o;c[m>>2]=n;o=c[f>>2]|0;if(o>>>0<n>>>0){c[m>>2]=o;c[f>>2]=n;p=2}else{p=1}}else{t=(n|0)/4|0;p=Wg(a,a+(t<<2)|0,m,a+(t+p<<2)|0,f,0)|0}}while(0);n=c[a>>2]|0;q=c[m>>2]|0;do{if(n>>>0<q>>>0){o=f;n=p}else{o=f;while(1){o=o+ -4|0;if((a|0)==(o|0)){break}r=c[o>>2]|0;if(r>>>0<q>>>0){j=67;break}}if((j|0)==67){j=0;c[a>>2]=r;c[o>>2]=n;n=p+1|0;break}m=a+4|0;l=c[f>>2]|0;if(!(n>>>0<l>>>0)){if((m|0)==(f|0)){j=84;break a}while(1){o=c[m>>2]|0;p=m+4|0;if(n>>>0<o>>>0){break}if((p|0)==(f|0)){j=84;break a}else{m=p}}c[m>>2]=l;c[f>>2]=o;m=p}if((m|0)==(f|0)){j=84;break a}else{p=f}while(1){l=c[a>>2]|0;while(1){n=c[m>>2]|0;o=m+4|0;if(l>>>0<n>>>0){break}else{m=o}}do{p=p+ -4|0;q=c[p>>2]|0}while(l>>>0<q>>>0);if(!(m>>>0<p>>>0)){a=m;continue b}c[m>>2]=q;c[p>>2]=n;m=o}}}while(0);r=a+4|0;c:do{if(r>>>0<o>>>0){while(1){q=c[m>>2]|0;s=r;while(1){t=c[s>>2]|0;r=s+4|0;if(t>>>0<q>>>0){s=r}else{p=o;break}}do{p=p+ -4|0;o=c[p>>2]|0}while(!(o>>>0<q>>>0));if(s>>>0>p>>>0){o=s;break c}c[s>>2]=o;c[p>>2]=t;o=p;m=(m|0)==(s|0)?p:m;n=n+1|0}}else{o=r}}while(0);if((o|0)!=(m|0)?(g=c[m>>2]|0,h=c[o>>2]|0,g>>>0<h>>>0):0){c[o>>2]=g;c[m>>2]=h;n=n+1|0}if((n|0)==0){n=Fh(a,o,0)|0;m=o+4|0;if(Fh(m,b,0)|0){j=79;break}if(n){a=m;continue}}t=o;if((t-l|0)>=(k-t|0)){j=83;break}Eh(a,o,d);a=o+4|0}if((j|0)==79){j=0;if(n){j=84;break}else{b=o;continue}}else if((j|0)==83){j=0;Eh(o+4|0,b,d);b=o;continue}}if((j|0)==4){d=c[f>>2]|0;b=c[a>>2]|0;if(!(d>>>0<b>>>0)){i=e;return}c[a>>2]=d;c[f>>2]=b;i=e;return}else if((j|0)==6){b=a+4|0;h=c[b>>2]|0;d=c[a>>2]|0;g=c[f>>2]|0;j=g>>>0<h>>>0;if(!(h>>>0<d>>>0)){if(!j){i=e;return}c[b>>2]=g;c[f>>2]=h;f=c[b>>2]|0;d=c[a>>2]|0;if(!(f>>>0<d>>>0)){i=e;return}c[a>>2]=f;c[b>>2]=d;i=e;return}if(j){c[a>>2]=g;c[f>>2]=d;i=e;return}c[a>>2]=h;c[b>>2]=d;a=c[f>>2]|0;if(!(a>>>0<d>>>0)){i=e;return}c[b>>2]=a;c[f>>2]=d;i=e;return}else if((j|0)==14){b=a+4|0;d=a+8|0;j=c[b>>2]|0;g=c[a>>2]|0;h=c[d>>2]|0;k=h>>>0<j>>>0;do{if(j>>>0<g>>>0){if(k){c[a>>2]=h;c[d>>2]=g;break}c[a>>2]=j;c[b>>2]=g;if(h>>>0<g>>>0){c[b>>2]=h;c[d>>2]=g}else{g=h}}else{if(k){c[b>>2]=h;c[d>>2]=j;if(h>>>0<g>>>0){c[a>>2]=h;c[b>>2]=g;g=j}else{g=j}}else{g=h}}}while(0);h=c[f>>2]|0;if(!(h>>>0<g>>>0)){i=e;return}c[d>>2]=h;c[f>>2]=g;f=c[d>>2]|0;g=c[b>>2]|0;if(!(f>>>0<g>>>0)){i=e;return}c[b>>2]=f;c[d>>2]=g;d=c[a>>2]|0;if(!(f>>>0<d>>>0)){i=e;return}c[a>>2]=f;c[b>>2]=d;i=e;return}else if((j|0)==26){Wg(a,a+4|0,a+8|0,a+12|0,f,0)|0;i=e;return}else if((j|0)==28){d=a+8|0;j=a+4|0;g=c[j>>2]|0;h=c[a>>2]|0;k=c[d>>2]|0;f=k>>>0<g>>>0;do{if(g>>>0<h>>>0){if(f){c[a>>2]=k;c[d>>2]=h;break}c[a>>2]=g;c[j>>2]=h;if(k>>>0<h>>>0){c[j>>2]=k;c[d>>2]=h}else{h=k}}else{if(f){c[j>>2]=k;c[d>>2]=g;if(k>>>0<h>>>0){c[a>>2]=k;c[j>>2]=h;h=g}else{h=g}}else{h=k}}}while(0);f=a+12|0;if((f|0)==(b|0)){i=e;return}while(1){g=c[f>>2]|0;if(g>>>0<h>>>0){j=f;while(1){c[j>>2]=h;if((d|0)==(a|0)){d=a;break}j=d+ -4|0;h=c[j>>2]|0;if(g>>>0<h>>>0){t=d;d=j;j=t}else{break}}c[d>>2]=g}d=f+4|0;if((d|0)==(b|0)){break}t=f;h=c[f>>2]|0;f=d;d=t}i=e;return}else if((j|0)==84){i=e;return}}function Fh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;switch(b-a>>2|0){case 4:{e=a+4|0;f=a+8|0;b=b+ -4|0;j=c[e>>2]|0;g=c[a>>2]|0;h=c[f>>2]|0;k=h>>>0<j>>>0;do{if(j>>>0<g>>>0){if(k){c[a>>2]=h;c[f>>2]=g;break}c[a>>2]=j;c[e>>2]=g;if(h>>>0<g>>>0){c[e>>2]=h;c[f>>2]=g}else{g=h}}else{if(k){c[e>>2]=h;c[f>>2]=j;if(h>>>0<g>>>0){c[a>>2]=h;c[e>>2]=g;g=j}else{g=j}}else{g=h}}}while(0);h=c[b>>2]|0;if(!(h>>>0<g>>>0)){l=1;i=d;return l|0}c[f>>2]=h;c[b>>2]=g;b=c[f>>2]|0;g=c[e>>2]|0;if(!(b>>>0<g>>>0)){l=1;i=d;return l|0}c[e>>2]=b;c[f>>2]=g;f=c[a>>2]|0;if(!(b>>>0<f>>>0)){l=1;i=d;return l|0}c[a>>2]=b;c[e>>2]=f;l=1;i=d;return l|0};case 2:{b=b+ -4|0;f=c[b>>2]|0;e=c[a>>2]|0;if(!(f>>>0<e>>>0)){l=1;i=d;return l|0}c[a>>2]=f;c[b>>2]=e;l=1;i=d;return l|0};case 3:{e=a+4|0;f=b+ -4|0;j=c[e>>2]|0;b=c[a>>2]|0;g=c[f>>2]|0;h=g>>>0<j>>>0;if(!(j>>>0<b>>>0)){if(!h){l=1;i=d;return l|0}c[e>>2]=g;c[f>>2]=j;b=c[e>>2]|0;f=c[a>>2]|0;if(!(b>>>0<f>>>0)){l=1;i=d;return l|0}c[a>>2]=b;c[e>>2]=f;l=1;i=d;return l|0}if(h){c[a>>2]=g;c[f>>2]=b;l=1;i=d;return l|0}c[a>>2]=j;c[e>>2]=b;a=c[f>>2]|0;if(!(a>>>0<b>>>0)){l=1;i=d;return l|0}c[e>>2]=a;c[f>>2]=b;l=1;i=d;return l|0};case 1:case 0:{l=1;i=d;return l|0};case 5:{Wg(a,a+4|0,a+8|0,a+12|0,b+ -4|0,0)|0;l=1;i=d;return l|0};default:{h=a+8|0;g=a+4|0;f=c[g>>2]|0;k=c[a>>2]|0;l=c[h>>2]|0;j=l>>>0<f>>>0;do{if(f>>>0<k>>>0){if(j){c[a>>2]=l;c[h>>2]=k;break}c[a>>2]=f;c[g>>2]=k;if(l>>>0<k>>>0){c[g>>2]=l;c[h>>2]=k}else{k=l}}else{if(j){c[g>>2]=l;c[h>>2]=f;if(l>>>0<k>>>0){c[a>>2]=l;c[g>>2]=k;k=f}else{k=f}}else{k=l}}}while(0);f=a+12|0;if((f|0)==(b|0)){l=1;i=d;return l|0}else{g=0}while(1){j=c[f>>2]|0;if(j>>>0<k>>>0){l=f;while(1){c[l>>2]=k;if((h|0)==(a|0)){h=a;break}l=h+ -4|0;k=c[l>>2]|0;if(j>>>0<k>>>0){m=h;h=l;l=m}else{break}}c[h>>2]=j;g=g+1|0;if((g|0)==8){break}}h=f+4|0;if((h|0)==(b|0)){a=1;e=41;break}m=f;k=c[f>>2]|0;f=h;h=m}if((e|0)==41){i=d;return a|0}m=(f+4|0)==(b|0);i=d;return m|0}}return 0}function Gh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;b=i;i=i+16|0;e=b;g=c[r>>2]|0;ai(23360,g,23416);c[5662]=24916;c[22656>>2]=24936;c[22652>>2]=0;ij(22656|0,23360);c[22728>>2]=0;c[22732>>2]=-1;f=c[s>>2]|0;c[5866]=24784;po(23468|0);c[23472>>2]=0;c[23476>>2]=0;c[23480>>2]=0;c[23484>>2]=0;c[23488>>2]=0;c[23492>>2]=0;c[5866]=23976;c[23496>>2]=f;qo(e,23468|0);d=so(e,27576)|0;ro(e);c[23500>>2]=d;c[23504>>2]=23424;a[23508|0]=(sc[c[(c[d>>2]|0)+28>>2]&127](d)|0)&1;c[5684]=24996;c[22740>>2]=25016;ij(22740|0,23464);c[22812>>2]=0;c[22816>>2]=-1;d=c[q>>2]|0;c[5878]=24784;po(23516|0);c[23520>>2]=0;c[23524>>2]=0;c[23528>>2]=0;c[23532>>2]=0;c[23536>>2]=0;c[23540>>2]=0;c[5878]=23976;c[23544>>2]=d;qo(e,23516|0);h=so(e,27576)|0;ro(e);c[23548>>2]=h;c[23552>>2]=23432;a[23556|0]=(sc[c[(c[h>>2]|0)+28>>2]&127](h)|0)&1;c[5706]=24996;c[22828>>2]=25016;ij(22828|0,23512);c[22900>>2]=0;c[22904>>2]=-1;h=c[(c[(c[5706]|0)+ -12>>2]|0)+22848>>2]|0;c[5728]=24996;c[22916>>2]=25016;ij(22916|0,h);c[22988>>2]=0;c[22992>>2]=-1;c[(c[(c[5662]|0)+ -12>>2]|0)+22720>>2]=22736;h=(c[(c[5706]|0)+ -12>>2]|0)+22828|0;c[h>>2]=c[h>>2]|8192;c[(c[(c[5706]|0)+ -12>>2]|0)+22896>>2]=22736;Oh(23560,g,23440|0);c[5750]=24956;c[23008>>2]=24976;c[23004>>2]=0;ij(23008|0,23560);c[23080>>2]=0;c[23084>>2]=-1;c[5904]=24848;po(23620|0);c[23624>>2]=0;c[23628>>2]=0;c[23632>>2]=0;c[23636>>2]=0;c[23640>>2]=0;c[23644>>2]=0;c[5904]=23720;c[23648>>2]=f;qo(e,23620|0);f=so(e,27584)|0;ro(e);c[23652>>2]=f;c[23656>>2]=23448;a[23660|0]=(sc[c[(c[f>>2]|0)+28>>2]&127](f)|0)&1;c[5772]=25036;c[23092>>2]=25056;ij(23092|0,23616);c[23164>>2]=0;c[23168>>2]=-1;c[5916]=24848;po(23668|0);c[23672>>2]=0;c[23676>>2]=0;c[23680>>2]=0;c[23684>>2]=0;c[23688>>2]=0;c[23692>>2]=0;c[5916]=23720;c[23696>>2]=d;qo(e,23668|0);d=so(e,27584)|0;ro(e);c[23700>>2]=d;c[23704>>2]=23456;a[23708|0]=(sc[c[(c[d>>2]|0)+28>>2]&127](d)|0)&1;c[5794]=25036;c[23180>>2]=25056;ij(23180|0,23664);c[23252>>2]=0;c[23256>>2]=-1;d=c[(c[(c[5794]|0)+ -12>>2]|0)+23200>>2]|0;c[5816]=25036;c[23268>>2]=25056;ij(23268|0,d);c[23340>>2]=0;c[23344>>2]=-1;c[(c[(c[5750]|0)+ -12>>2]|0)+23072>>2]=23088;d=(c[(c[5794]|0)+ -12>>2]|0)+23180|0;c[d>>2]=c[d>>2]|8192;c[(c[(c[5794]|0)+ -12>>2]|0)+23248>>2]=23088;i=b;return}function Hh(a){a=a|0;a=i;Pj(22736)|0;Pj(22912)|0;Vj(23088)|0;Vj(23264)|0;i=a;return}function Ih(a){a=a|0;var b=0;b=i;c[a>>2]=24848;ro(a+4|0);i=b;return}function Jh(a){a=a|0;var b=0;b=i;c[a>>2]=24848;ro(a+4|0);jr(a);i=b;return}function Kh(b,d){b=b|0;d=d|0;var e=0;e=i;sc[c[(c[b>>2]|0)+24>>2]&127](b)|0;d=so(d,27584)|0;c[b+36>>2]=d;a[b+44|0]=(sc[c[(c[d>>2]|0)+28>>2]&127](d)|0)&1;i=e;return}function Lh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;i=i+16|0;g=b+8|0;d=b;e=a+36|0;f=a+40|0;h=g+8|0;j=g;a=a+32|0;while(1){k=c[e>>2]|0;k=Cc[c[(c[k>>2]|0)+20>>2]&15](k,c[f>>2]|0,g,h,d)|0;l=(c[d>>2]|0)-j|0;if((pb(g|0,1,l|0,c[a>>2]|0)|0)!=(l|0)){e=-1;d=5;break}if((k|0)==2){e=-1;d=5;break}else if((k|0)!=1){d=4;break}}if((d|0)==4){l=((Rb(c[a>>2]|0)|0)!=0)<<31>>31;i=b;return l|0}else if((d|0)==5){i=b;return e|0}return 0}function Mh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;a:do{if((a[b+44|0]|0)==0){if((e|0)>0){g=0;while(1){if((Bc[c[(c[b>>2]|0)+52>>2]&31](b,c[d>>2]|0)|0)==-1){break a}g=g+1|0;if((g|0)<(e|0)){d=d+4|0}else{break}}}else{g=0}}else{g=pb(d|0,4,e|0,c[b+32>>2]|0)|0}}while(0);i=f;return g|0}function Nh(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+32|0;j=e+16|0;p=e+8|0;h=e+4|0;k=e;f=(d|0)==-1;a:do{if(!f){c[p>>2]=d;if((a[b+44|0]|0)!=0){if((pb(p|0,4,1,c[b+32>>2]|0)|0)==1){break}else{d=-1}i=e;return d|0}c[h>>2]=j;l=p+4|0;n=b+36|0;o=b+40|0;g=j+8|0;m=j;b=b+32|0;while(1){q=c[n>>2]|0;q=xc[c[(c[q>>2]|0)+12>>2]&15](q,c[o>>2]|0,p,l,k,j,g,h)|0;if((c[k>>2]|0)==(p|0)){d=-1;g=12;break}if((q|0)==3){g=7;break}r=(q|0)==1;if(!(q>>>0<2)){d=-1;g=12;break}q=(c[h>>2]|0)-m|0;if((pb(j|0,1,q|0,c[b>>2]|0)|0)!=(q|0)){d=-1;g=12;break}if(r){p=r?c[k>>2]|0:p}else{break a}}if((g|0)==7){if((pb(p|0,1,1,c[b>>2]|0)|0)==1){break}else{d=-1}i=e;return d|0}else if((g|0)==12){i=e;return d|0}}}while(0);r=f?0:d;i=e;return r|0}function Oh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+16|0;g=f;c[b>>2]=24848;h=b+4|0;po(h);j=b+8|0;c[j+0>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0;c[j+12>>2]=0;c[j+16>>2]=0;c[j+20>>2]=0;c[b>>2]=23832;c[b+32>>2]=d;c[b+40>>2]=e;c[b+48>>2]=-1;a[b+52|0]=0;qo(g,h);h=so(g,27584)|0;e=b+36|0;c[e>>2]=h;d=b+44|0;c[d>>2]=sc[c[(c[h>>2]|0)+24>>2]&127](h)|0;e=c[e>>2]|0;a[b+53|0]=(sc[c[(c[e>>2]|0)+28>>2]&127](e)|0)&1;if((c[d>>2]|0)>8){An(23928)}else{ro(g);i=f;return}}function Ph(a){a=a|0;var b=0;b=i;c[a>>2]=24848;ro(a+4|0);i=b;return}function Qh(a){a=a|0;var b=0;b=i;c[a>>2]=24848;ro(a+4|0);jr(a);i=b;return}function Rh(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;g=so(d,27584)|0;f=b+36|0;c[f>>2]=g;d=b+44|0;c[d>>2]=sc[c[(c[g>>2]|0)+24>>2]&127](g)|0;f=c[f>>2]|0;a[b+53|0]=(sc[c[(c[f>>2]|0)+28>>2]&127](f)|0)&1;if((c[d>>2]|0)>8){An(23928)}else{i=e;return}}function Sh(a){a=a|0;var b=0;b=i;a=Vh(a,0)|0;i=b;return a|0}function Th(a){a=a|0;var b=0;b=i;a=Vh(a,1)|0;i=b;return a|0}function Uh(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+32|0;j=e+16|0;f=e+8|0;l=e+4|0;k=e;g=b+52|0;m=(a[g]|0)!=0;if((d|0)==-1){if(m){m=-1;i=e;return m|0}m=c[b+48>>2]|0;a[g]=(m|0)!=-1|0;i=e;return m|0}h=b+48|0;a:do{if(m){c[l>>2]=c[h>>2];m=c[b+36>>2]|0;k=xc[c[(c[m>>2]|0)+12>>2]&15](m,c[b+40>>2]|0,l,l+4|0,k,j,j+8|0,f)|0;if((k|0)==1|(k|0)==2){m=-1;i=e;return m|0}else if((k|0)==3){a[j]=c[h>>2];c[f>>2]=j+1}b=b+32|0;while(1){k=c[f>>2]|0;if(!(k>>>0>j>>>0)){break a}m=k+ -1|0;c[f>>2]=m;if((Qb(a[m]|0,c[b>>2]|0)|0)==-1){f=-1;break}}i=e;return f|0}}while(0);c[h>>2]=d;a[g]=1;m=d;i=e;return m|0}function Vh(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+32|0;g=e+16|0;j=e+8|0;m=e+4|0;l=e;n=b+52|0;if((a[n]|0)!=0){f=b+48|0;g=c[f>>2]|0;if(!d){v=g;i=e;return v|0}c[f>>2]=-1;a[n]=0;v=g;i=e;return v|0}n=c[b+44>>2]|0;s=(n|0)>1?n:1;a:do{if((s|0)>0){n=b+32|0;o=0;while(1){p=Jb(c[n>>2]|0)|0;if((p|0)==-1){f=-1;break}a[g+o|0]=p;o=o+1|0;if((o|0)>=(s|0)){break a}}i=e;return f|0}}while(0);b:do{if((a[b+53|0]|0)==0){p=b+40|0;o=b+36|0;n=j+4|0;q=b+32|0;while(1){v=c[p>>2]|0;u=v;t=c[u>>2]|0;u=c[u+4>>2]|0;w=c[o>>2]|0;r=g+s|0;v=xc[c[(c[w>>2]|0)+16>>2]&15](w,v,g,r,m,j,n,l)|0;if((v|0)==2){f=-1;h=22;break}else if((v|0)==3){h=14;break}else if((v|0)!=1){k=s;break b}w=c[p>>2]|0;c[w>>2]=t;c[w+4>>2]=u;if((s|0)==8){f=-1;h=22;break}t=Jb(c[q>>2]|0)|0;if((t|0)==-1){f=-1;h=22;break}a[r]=t;s=s+1|0}if((h|0)==14){c[j>>2]=a[g]|0;k=s;break}else if((h|0)==22){i=e;return f|0}}else{c[j>>2]=a[g]|0;k=s}}while(0);if(d){w=c[j>>2]|0;c[b+48>>2]=w;i=e;return w|0}d=b+32|0;while(1){if((k|0)<=0){break}k=k+ -1|0;if((Qb(a[g+k|0]|0,c[d>>2]|0)|0)==-1){f=-1;h=22;break}}if((h|0)==22){i=e;return f|0}w=c[j>>2]|0;i=e;return w|0}function Wh(a){a=a|0;var b=0;b=i;c[a>>2]=24784;ro(a+4|0);i=b;return}function Xh(a){a=a|0;var b=0;b=i;c[a>>2]=24784;ro(a+4|0);jr(a);i=b;return}function Yh(b,d){b=b|0;d=d|0;var e=0;e=i;sc[c[(c[b>>2]|0)+24>>2]&127](b)|0;d=so(d,27576)|0;c[b+36>>2]=d;a[b+44|0]=(sc[c[(c[d>>2]|0)+28>>2]&127](d)|0)&1;i=e;return}function Zh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;i=i+16|0;g=b+8|0;d=b;e=a+36|0;f=a+40|0;h=g+8|0;j=g;a=a+32|0;while(1){k=c[e>>2]|0;k=Cc[c[(c[k>>2]|0)+20>>2]&15](k,c[f>>2]|0,g,h,d)|0;l=(c[d>>2]|0)-j|0;if((pb(g|0,1,l|0,c[a>>2]|0)|0)!=(l|0)){e=-1;d=5;break}if((k|0)==2){e=-1;d=5;break}else if((k|0)!=1){d=4;break}}if((d|0)==4){l=((Rb(c[a>>2]|0)|0)!=0)<<31>>31;i=b;return l|0}else if((d|0)==5){i=b;return e|0}return 0}function _h(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0;g=i;if((a[b+44|0]|0)!=0){h=pb(e|0,1,f|0,c[b+32>>2]|0)|0;i=g;return h|0}if((f|0)>0){h=0}else{h=0;i=g;return h|0}while(1){if((Bc[c[(c[b>>2]|0)+52>>2]&31](b,d[e]|0)|0)==-1){f=6;break}h=h+1|0;if((h|0)<(f|0)){e=e+1|0}else{f=6;break}}if((f|0)==6){i=g;return h|0}return 0}function $h(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+32|0;j=e+16|0;p=e+8|0;h=e+4|0;k=e;f=(d|0)==-1;a:do{if(!f){a[p]=d;if((a[b+44|0]|0)!=0){if((pb(p|0,1,1,c[b+32>>2]|0)|0)==1){break}else{d=-1}i=e;return d|0}c[h>>2]=j;l=p+1|0;n=b+36|0;o=b+40|0;g=j+8|0;m=j;b=b+32|0;while(1){q=c[n>>2]|0;q=xc[c[(c[q>>2]|0)+12>>2]&15](q,c[o>>2]|0,p,l,k,j,g,h)|0;if((c[k>>2]|0)==(p|0)){d=-1;g=12;break}if((q|0)==3){g=7;break}r=(q|0)==1;if(!(q>>>0<2)){d=-1;g=12;break}q=(c[h>>2]|0)-m|0;if((pb(j|0,1,q|0,c[b>>2]|0)|0)!=(q|0)){d=-1;g=12;break}if(r){p=r?c[k>>2]|0:p}else{break a}}if((g|0)==7){if((pb(p|0,1,1,c[b>>2]|0)|0)==1){break}else{d=-1}i=e;return d|0}else if((g|0)==12){i=e;return d|0}}}while(0);r=f?0:d;i=e;return r|0}function ai(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+16|0;g=f;c[b>>2]=24784;h=b+4|0;po(h);j=b+8|0;c[j+0>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0;c[j+12>>2]=0;c[j+16>>2]=0;c[j+20>>2]=0;c[b>>2]=24088;c[b+32>>2]=d;c[b+40>>2]=e;c[b+48>>2]=-1;a[b+52|0]=0;qo(g,h);h=so(g,27576)|0;e=b+36|0;c[e>>2]=h;d=b+44|0;c[d>>2]=sc[c[(c[h>>2]|0)+24>>2]&127](h)|0;e=c[e>>2]|0;a[b+53|0]=(sc[c[(c[e>>2]|0)+28>>2]&127](e)|0)&1;if((c[d>>2]|0)>8){An(23928)}else{ro(g);i=f;return}}function bi(a){a=a|0;var b=0;b=i;c[a>>2]=24784;ro(a+4|0);i=b;return}function ci(a){a=a|0;var b=0;b=i;c[a>>2]=24784;ro(a+4|0);jr(a);i=b;return}function di(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;g=so(d,27576)|0;f=b+36|0;c[f>>2]=g;d=b+44|0;c[d>>2]=sc[c[(c[g>>2]|0)+24>>2]&127](g)|0;f=c[f>>2]|0;a[b+53|0]=(sc[c[(c[f>>2]|0)+28>>2]&127](f)|0)&1;if((c[d>>2]|0)>8){An(23928)}else{i=e;return}}function ei(a){a=a|0;var b=0;b=i;a=hi(a,0)|0;i=b;return a|0}function fi(a){a=a|0;var b=0;b=i;a=hi(a,1)|0;i=b;return a|0}function gi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+32|0;j=e+16|0;f=e+4|0;l=e+8|0;k=e;g=b+52|0;m=(a[g]|0)!=0;if((d|0)==-1){if(m){m=-1;i=e;return m|0}m=c[b+48>>2]|0;a[g]=(m|0)!=-1|0;i=e;return m|0}h=b+48|0;a:do{if(m){a[l]=c[h>>2];m=c[b+36>>2]|0;k=xc[c[(c[m>>2]|0)+12>>2]&15](m,c[b+40>>2]|0,l,l+1|0,k,j,j+8|0,f)|0;if((k|0)==1|(k|0)==2){m=-1;i=e;return m|0}else if((k|0)==3){a[j]=c[h>>2];c[f>>2]=j+1}b=b+32|0;while(1){k=c[f>>2]|0;if(!(k>>>0>j>>>0)){break a}m=k+ -1|0;c[f>>2]=m;if((Qb(a[m]|0,c[b>>2]|0)|0)==-1){f=-1;break}}i=e;return f|0}}while(0);c[h>>2]=d;a[g]=1;m=d;i=e;return m|0}function hi(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=i;i=i+32|0;g=f+16|0;k=f+8|0;n=f+4|0;m=f;o=b+52|0;if((a[o]|0)!=0){g=b+48|0;h=c[g>>2]|0;if(!e){w=h;i=f;return w|0}c[g>>2]=-1;a[o]=0;w=h;i=f;return w|0}o=c[b+44>>2]|0;s=(o|0)>1?o:1;a:do{if((s|0)>0){o=b+32|0;p=0;while(1){q=Jb(c[o>>2]|0)|0;if((q|0)==-1){j=-1;break}a[g+p|0]=q;p=p+1|0;if((p|0)>=(s|0)){break a}}i=f;return j|0}}while(0);b:do{if((a[b+53|0]|0)==0){q=b+40|0;p=b+36|0;o=k+1|0;r=b+32|0;while(1){w=c[q>>2]|0;v=w;u=c[v>>2]|0;v=c[v+4>>2]|0;x=c[p>>2]|0;t=g+s|0;w=xc[c[(c[x>>2]|0)+16>>2]&15](x,w,g,t,n,k,o,m)|0;if((w|0)==3){m=14;break}else if((w|0)==2){j=-1;m=23;break}else if((w|0)!=1){l=s;break b}x=c[q>>2]|0;c[x>>2]=u;c[x+4>>2]=v;if((s|0)==8){j=-1;m=23;break}u=Jb(c[r>>2]|0)|0;if((u|0)==-1){j=-1;m=23;break}a[t]=u;s=s+1|0}if((m|0)==14){a[k]=a[g]|0;l=s;break}else if((m|0)==23){i=f;return j|0}}else{a[k]=a[g]|0;l=s}}while(0);do{if(!e){e=b+32|0;while(1){if((l|0)<=0){m=21;break}l=l+ -1|0;if((Qb(d[g+l|0]|0,c[e>>2]|0)|0)==-1){j=-1;m=23;break}}if((m|0)==21){h=a[k]|0;break}else if((m|0)==23){i=f;return j|0}}else{h=a[k]|0;c[b+48>>2]=h&255}}while(0);x=h&255;i=f;return x|0}function ii(){var a=0;a=i;Gh(0);jc(121,23352,p|0)|0;i=a;return}function ji(a){a=a|0;return}function ki(a){a=a|0;a=a+4|0;c[a>>2]=(c[a>>2]|0)+1;return}function li(a){a=a|0;var b=0,d=0,e=0;b=i;e=a+4|0;d=c[e>>2]|0;c[e>>2]=d+ -1;if((d|0)!=0){e=0;i=b;return e|0}pc[c[(c[a>>2]|0)+8>>2]&255](a);e=1;i=b;return e|0}function mi(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;c[a>>2]=24232;e=Cr(b|0)|0;g=ir(e+13|0)|0;c[g+4>>2]=e;c[g>>2]=e;f=g+12|0;c[a+4>>2]=f;c[g+8>>2]=0;Fr(f|0,b|0,e+1|0)|0;i=d;return}function ni(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;c[a>>2]=24232;d=a+4|0;f=(c[d>>2]|0)+ -4|0;e=c[f>>2]|0;c[f>>2]=e+ -1;if((e+ -1|0)<0){kr((c[d>>2]|0)+ -12|0)}Ua(a|0);jr(a);i=b;return}function oi(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;c[a>>2]=24232;d=a+4|0;f=(c[d>>2]|0)+ -4|0;e=c[f>>2]|0;c[f>>2]=e+ -1;if((e+ -1|0)>=0){Ua(a|0);i=b;return}kr((c[d>>2]|0)+ -12|0);Ua(a|0);i=b;return}function pi(a){a=a|0;return c[a+4>>2]|0}function qi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;c[b>>2]=24256;if((a[d]&1)==0){d=d+1|0}else{d=c[d+8>>2]|0}f=Cr(d|0)|0;h=ir(f+13|0)|0;c[h+4>>2]=f;c[h>>2]=f;g=h+12|0;c[b+4>>2]=g;c[h+8>>2]=0;Fr(g|0,d|0,f+1|0)|0;i=e;return}function ri(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;c[a>>2]=24256;e=Cr(b|0)|0;g=ir(e+13|0)|0;c[g+4>>2]=e;c[g>>2]=e;f=g+12|0;c[a+4>>2]=f;c[g+8>>2]=0;Fr(f|0,b|0,e+1|0)|0;i=d;return}function si(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;c[a>>2]=24256;d=a+4|0;f=(c[d>>2]|0)+ -4|0;e=c[f>>2]|0;c[f>>2]=e+ -1;if((e+ -1|0)<0){kr((c[d>>2]|0)+ -12|0)}Ua(a|0);jr(a);i=b;return}function ti(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;c[a>>2]=24256;d=a+4|0;f=(c[d>>2]|0)+ -4|0;e=c[f>>2]|0;c[f>>2]=e+ -1;if((e+ -1|0)>=0){Ua(a|0);i=b;return}kr((c[d>>2]|0)+ -12|0);Ua(a|0);i=b;return}function ui(a){a=a|0;return c[a+4>>2]|0}function vi(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;c[a>>2]=24232;d=a+4|0;f=(c[d>>2]|0)+ -4|0;e=c[f>>2]|0;c[f>>2]=e+ -1;if((e+ -1|0)<0){kr((c[d>>2]|0)+ -12|0)}Ua(a|0);jr(a);i=b;return}function wi(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;c[a>>2]=24232;d=a+4|0;f=(c[d>>2]|0)+ -4|0;e=c[f>>2]|0;c[f>>2]=e+ -1;if((e+ -1|0)<0){kr((c[d>>2]|0)+ -12|0)}Ua(a|0);jr(a);i=b;return}function xi(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;c[a>>2]=24232;d=a+4|0;f=(c[d>>2]|0)+ -4|0;e=c[f>>2]|0;c[f>>2]=e+ -1;if((e+ -1|0)<0){kr((c[d>>2]|0)+ -12|0)}Ua(a|0);jr(a);i=b;return}function yi(a){a=a|0;return}function zi(a,b,d){a=a|0;b=b|0;d=d|0;c[a>>2]=d;c[a+4>>2]=b;return}function Ai(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+16|0;f=e;uc[c[(c[a>>2]|0)+12>>2]&7](f,a,b);if((c[f+4>>2]|0)!=(c[d+4>>2]|0)){a=0;i=e;return a|0}a=(c[f>>2]|0)==(c[d>>2]|0);i=e;return a|0}function Bi(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;if((c[b+4>>2]|0)!=(a|0)){a=0;i=e;return a|0}a=(c[b>>2]|0)==(d|0);i=e;return a|0}function Ci(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;d=i;f=gc(e|0)|0;e=Cr(f|0)|0;if(e>>>0>4294967279){Ii(0)}if(e>>>0<11){a[b]=e<<1;b=b+1|0;Fr(b|0,f|0,e|0)|0;f=b+e|0;a[f]=0;i=d;return}else{h=e+16&-16;g=hr(h)|0;c[b+8>>2]=g;c[b>>2]=h|1;c[b+4>>2]=e;b=g;Fr(b|0,f|0,e|0)|0;f=b+e|0;a[f]=0;i=d;return}}function Di(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;g=i;i=i+16|0;f=g;h=c[d>>2]|0;if((h|0)!=0){j=a[e]|0;if((j&1)==0){j=(j&255)>>>1}else{j=c[e+4>>2]|0}if((j|0)!=0){Vi(e,24536,2)|0;h=c[d>>2]|0}j=c[d+4>>2]|0;uc[c[(c[j>>2]|0)+24>>2]&7](f,j,h);h=a[f]|0;if((h&1)==0){d=f+1|0;h=(h&255)>>>1}else{d=c[f+8>>2]|0;h=c[f+4>>2]|0}Vi(e,d,h)|0;if(!((a[f]&1)==0)){jr(c[f+8>>2]|0)}}c[b+0>>2]=c[e+0>>2];c[b+4>>2]=c[e+4>>2];c[b+8>>2]=c[e+8>>2];c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;i=g;return}function Ei(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+32|0;h=f+12|0;g=f;j=Cr(e|0)|0;if(j>>>0>4294967279){Ii(0)}if(j>>>0<11){a[g]=j<<1;k=g+1|0}else{l=j+16&-16;k=hr(l)|0;c[g+8>>2]=k;c[g>>2]=l|1;c[g+4>>2]=j}Fr(k|0,e|0,j|0)|0;a[k+j|0]=0;Di(h,d,g);qi(b,h);if(!((a[h]&1)==0)){jr(c[h+8>>2]|0)}if(!((a[g]&1)==0)){jr(c[g+8>>2]|0)}c[b>>2]=24552;e=d;k=c[e+4>>2]|0;l=b+8|0;c[l>>2]=c[e>>2];c[l+4>>2]=k;i=f;return}function Fi(a){a=a|0;var b=0;b=i;ti(a);jr(a);i=b;return}function Gi(a){a=a|0;var b=0;b=i;ti(a);i=b;return}function Hi(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;Tb(24688)|0;if((c[a>>2]|0)==1){do{Pb(24712,24688)|0}while((c[a>>2]|0)==1)}if((c[a>>2]|0)==0){c[a>>2]=1;_b(24688)|0;pc[d&255](b);Tb(24688)|0;c[a>>2]=-1;_b(24688)|0;Hb(24712)|0;i=e;return}else{_b(24688)|0;i=e;return}}function Ii(a){a=a|0;a=wb(8)|0;mi(a,24760);c[a>>2]=24376;ec(a|0,24416,21)}function Ji(a){a=a|0;a=wb(8)|0;mi(a,24760);c[a>>2]=24440;ec(a|0,24480,21)}function Ki(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;if((a[d]&1)==0){c[b+0>>2]=c[d+0>>2];c[b+4>>2]=c[d+4>>2];c[b+8>>2]=c[d+8>>2];i=e;return}f=c[d+8>>2]|0;d=c[d+4>>2]|0;if(d>>>0>4294967279){Ii(0)}if(d>>>0<11){a[b]=d<<1;b=b+1|0}else{h=d+16&-16;g=hr(h)|0;c[b+8>>2]=g;c[b>>2]=h|1;c[b+4>>2]=d;b=g}Fr(b|0,f|0,d|0)|0;a[b+d|0]=0;i=e;return}function Li(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;if(e>>>0>4294967279){Ii(0)}if(e>>>0<11){a[b]=e<<1;b=b+1|0}else{h=e+16&-16;g=hr(h)|0;c[b+8>>2]=g;c[b>>2]=h|1;c[b+4>>2]=e;b=g}Fr(b|0,d|0,e|0)|0;a[b+e|0]=0;i=f;return}function Mi(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;if(d>>>0>4294967279){Ii(0)}if(d>>>0<11){a[b]=d<<1;b=b+1|0}else{h=d+16&-16;g=hr(h)|0;c[b+8>>2]=g;c[b>>2]=h|1;c[b+4>>2]=d;b=g}Hr(b|0,e|0,d|0)|0;a[b+d|0]=0;i=f;return}function Ni(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0;g=i;h=a[d]|0;j=(h&1)==0;if(j){h=(h&255)>>>1}else{h=c[d+4>>2]|0}if(h>>>0<e>>>0){Ji(0)}if(j){d=d+1|0}else{d=c[d+8>>2]|0}d=d+e|0;e=h-e|0;f=e>>>0<f>>>0?e:f;if(f>>>0>4294967279){Ii(0)}if(f>>>0<11){a[b]=f<<1;j=b+1|0;Fr(j|0,d|0,f|0)|0;j=j+f|0;a[j]=0;i=g;return}else{h=f+16&-16;j=hr(h)|0;c[b+8>>2]=j;c[b>>2]=h|1;c[b+4>>2]=f;Fr(j|0,d|0,f|0)|0;j=j+f|0;a[j]=0;i=g;return}}function Oi(b){b=b|0;var d=0;d=i;if((a[b]&1)==0){i=d;return}jr(c[b+8>>2]|0);i=d;return}function Pi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;if((b|0)==(d|0)){i=e;return b|0}f=a[d]|0;if((f&1)==0){f=(f&255)>>>1;d=d+1|0}else{f=c[d+4>>2]|0;d=c[d+8>>2]|0}j=a[b]|0;if((j&1)==0){g=10}else{j=c[b>>2]|0;g=(j&-2)+ -1|0;j=j&255}h=(j&1)==0;if(g>>>0<f>>>0){if(h){h=(j&255)>>>1}else{h=c[b+4>>2]|0}Wi(b,g,f-g|0,h,0,h,f,d);i=e;return b|0}if(h){g=b+1|0}else{g=c[b+8>>2]|0}Gr(g|0,d|0,f|0)|0;a[g+f|0]=0;if((a[b]&1)==0){a[b]=f<<1;i=e;return b|0}else{c[b+4>>2]=f;i=e;return b|0}return 0}function Qi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;f=i;e=Cr(d|0)|0;h=a[b]|0;if((h&1)==0){g=10}else{g=c[b>>2]|0;h=g&255;g=(g&-2)+ -1|0}j=(h&1)==0;if(g>>>0<e>>>0){if(j){h=(h&255)>>>1}else{h=c[b+4>>2]|0}Wi(b,g,e-g|0,h,0,h,e,d);i=f;return b|0}if(j){g=b+1|0}else{g=c[b+8>>2]|0}Gr(g|0,d|0,e|0)|0;a[g+e|0]=0;if((a[b]&1)==0){a[b]=e<<1;i=f;return b|0}else{c[b+4>>2]=e;i=f;return b|0}return 0}function Ri(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;h=a[b]|0;g=(h&1)==0;if(g){h=(h&255)>>>1}else{h=c[b+4>>2]|0}if(h>>>0<d>>>0){Si(b,d-h|0,e)|0;i=f;return}if(g){a[b+d+1|0]=0;a[b]=d<<1;i=f;return}else{a[(c[b+8>>2]|0)+d|0]=0;c[b+4>>2]=d;i=f;return}}function Si(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;if((d|0)==0){i=f;return b|0}j=a[b]|0;if((j&1)==0){h=10}else{j=c[b>>2]|0;h=(j&-2)+ -1|0;j=j&255}if((j&1)==0){g=(j&255)>>>1}else{g=c[b+4>>2]|0}if((h-g|0)>>>0<d>>>0){Xi(b,h,d-h+g|0,g,g,0,0);j=a[b]|0}if((j&1)==0){h=b+1|0}else{h=c[b+8>>2]|0}Hr(h+g|0,e|0,d|0)|0;e=g+d|0;if((a[b]&1)==0){a[b]=e<<1}else{c[b+4>>2]=e}a[h+e|0]=0;i=f;return b|0}function Ti(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;if(d>>>0>4294967279){Ii(0)}g=a[b]|0;if((g&1)==0){h=10}else{g=c[b>>2]|0;h=(g&-2)+ -1|0;g=g&255}if((g&1)==0){f=(g&255)>>>1}else{f=c[b+4>>2]|0}d=f>>>0>d>>>0?f:d;if(d>>>0<11){d=10}else{d=(d+16&-16)+ -1|0}if((d|0)==(h|0)){i=e;return}do{if((d|0)!=10){j=d+1|0;if(d>>>0>h>>>0){k=hr(j)|0}else{k=hr(j)|0}if((g&1)==0){l=1;j=b+1|0;h=0;break}else{l=1;j=c[b+8>>2]|0;h=1;break}}else{k=b+1|0;l=0;j=c[b+8>>2]|0;h=1}}while(0);if((g&1)==0){g=(g&255)>>>1}else{g=c[b+4>>2]|0}Fr(k|0,j|0,g+1|0)|0;if(h){jr(j)}if(l){c[b>>2]=d+1|1;c[b+4>>2]=f;c[b+8>>2]=k;i=e;return}else{a[b]=f<<1;i=e;return}}function Ui(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;g=a[b]|0;f=(g&1)!=0;if(f){h=(c[b>>2]&-2)+ -1|0;g=c[b+4>>2]|0}else{h=10;g=(g&255)>>>1}if((g|0)==(h|0)){Xi(b,h,1,h,h,0,0);if((a[b]&1)==0){f=7}else{f=8}}else{if(f){f=8}else{f=7}}if((f|0)==7){a[b]=(g<<1)+2;f=b+1|0;h=g+1|0;g=f+g|0;a[g]=d;h=f+h|0;a[h]=0;i=e;return}else if((f|0)==8){f=c[b+8>>2]|0;h=g+1|0;c[b+4>>2]=h;g=f+g|0;a[g]=d;h=f+h|0;a[h]=0;i=e;return}}function Vi(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;j=a[b]|0;if((j&1)==0){g=10}else{j=c[b>>2]|0;g=(j&-2)+ -1|0;j=j&255}if((j&1)==0){h=(j&255)>>>1}else{h=c[b+4>>2]|0}if((g-h|0)>>>0<e>>>0){Wi(b,g,e-g+h|0,h,h,0,e,d);i=f;return b|0}if((e|0)==0){i=f;return b|0}if((j&1)==0){g=b+1|0}else{g=c[b+8>>2]|0}Fr(g+h|0,d|0,e|0)|0;e=h+e|0;if((a[b]&1)==0){a[b]=e<<1}else{c[b+4>>2]=e}a[g+e|0]=0;i=f;return b|0}function Wi(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0;m=i;if((-18-d|0)>>>0<e>>>0){Ii(0)}if((a[b]&1)==0){l=b+1|0}else{l=c[b+8>>2]|0}if(d>>>0<2147483623){n=e+d|0;e=d<<1;e=n>>>0<e>>>0?e:n;if(e>>>0<11){e=11}else{e=e+16&-16}}else{e=-17}n=hr(e)|0;if((g|0)!=0){Fr(n|0,l|0,g|0)|0}if((j|0)!=0){Fr(n+g|0,k|0,j|0)|0}k=f-h|0;if((k|0)!=(g|0)){Fr(n+(j+g)|0,l+(h+g)|0,k-g|0)|0}if((d|0)==10){f=b+8|0;c[f>>2]=n;e=e|1;c[b>>2]=e;e=k+j|0;f=b+4|0;c[f>>2]=e;n=n+e|0;a[n]=0;i=m;return}jr(l);f=b+8|0;c[f>>2]=n;e=e|1;c[b>>2]=e;e=k+j|0;f=b+4|0;c[f>>2]=e;n=n+e|0;a[n]=0;i=m;return}function Xi(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0;l=i;if((-17-d|0)>>>0<e>>>0){Ii(0)}if((a[b]&1)==0){k=b+1|0}else{k=c[b+8>>2]|0}if(d>>>0<2147483623){m=e+d|0;e=d<<1;e=m>>>0<e>>>0?e:m;if(e>>>0<11){e=11}else{e=e+16&-16}}else{e=-17}m=hr(e)|0;if((g|0)!=0){Fr(m|0,k|0,g|0)|0}f=f-h|0;if((f|0)!=(g|0)){Fr(m+(j+g)|0,k+(h+g)|0,f-g|0)|0}if((d|0)==10){f=b+8|0;c[f>>2]=m;m=e|1;c[b>>2]=m;i=l;return}jr(k);f=b+8|0;c[f>>2]=m;m=e|1;c[b>>2]=m;i=l;return}function Yi(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;if(e>>>0>1073741807){Ii(0)}if(e>>>0<2){a[b]=e<<1;b=b+4|0}else{h=e+4&-4;g=hr(h<<2)|0;c[b+8>>2]=g;c[b>>2]=h|1;c[b+4>>2]=e;b=g}Fq(b,d,e)|0;c[b+(e<<2)>>2]=0;i=f;return}function Zi(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;if(d>>>0>1073741807){Ii(0)}if(d>>>0<2){a[b]=d<<1;b=b+4|0}else{h=d+4&-4;g=hr(h<<2)|0;c[b+8>>2]=g;c[b>>2]=h|1;c[b+4>>2]=d;b=g}Hq(b,e,d)|0;c[b+(d<<2)>>2]=0;i=f;return}function _i(b){b=b|0;var d=0;d=i;if((a[b]&1)==0){i=d;return}jr(c[b+8>>2]|0);i=d;return}function $i(a,b){a=a|0;b=b|0;var c=0;c=i;a=aj(a,b,Eq(b)|0)|0;i=c;return a|0}function aj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;h=a[b]|0;if((h&1)==0){g=1}else{h=c[b>>2]|0;g=(h&-2)+ -1|0;h=h&255}j=(h&1)==0;if(g>>>0<e>>>0){if(j){h=(h&255)>>>1}else{h=c[b+4>>2]|0}dj(b,g,e-g|0,h,0,h,e,d);i=f;return b|0}if(j){g=b+4|0}else{g=c[b+8>>2]|0}Gq(g,d,e)|0;c[g+(e<<2)>>2]=0;if((a[b]&1)==0){a[b]=e<<1;i=f;return b|0}else{c[b+4>>2]=e;i=f;return b|0}return 0}function bj(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;if(d>>>0>1073741807){Ii(0)}g=a[b]|0;if((g&1)==0){h=1}else{g=c[b>>2]|0;h=(g&-2)+ -1|0;g=g&255}if((g&1)==0){f=(g&255)>>>1}else{f=c[b+4>>2]|0}d=f>>>0>d>>>0?f:d;if(d>>>0<2){d=1}else{d=(d+4&-4)+ -1|0}if((d|0)==(h|0)){i=e;return}do{if((d|0)!=1){j=(d<<2)+4|0;if(d>>>0>h>>>0){k=hr(j)|0}else{k=hr(j)|0}if((g&1)==0){l=1;j=b+4|0;h=0;break}else{l=1;j=c[b+8>>2]|0;h=1;break}}else{k=b+4|0;l=0;j=c[b+8>>2]|0;h=1}}while(0);if((g&1)==0){g=(g&255)>>>1}else{g=c[b+4>>2]|0}Fq(k,j,g+1|0)|0;if(h){jr(j)}if(l){c[b>>2]=d+1|1;c[b+4>>2]=f;c[b+8>>2]=k;i=e;return}else{a[b]=f<<1;i=e;return}}function cj(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;g=a[b]|0;f=(g&1)!=0;if(f){h=(c[b>>2]&-2)+ -1|0;g=c[b+4>>2]|0}else{h=1;g=(g&255)>>>1}if((g|0)==(h|0)){ej(b,h,1,h,h,0,0);if((a[b]&1)==0){f=7}else{f=8}}else{if(f){f=8}else{f=7}}if((f|0)==7){a[b]=(g<<1)+2;f=b+4|0;h=g+1|0;g=f+(g<<2)|0;c[g>>2]=d;h=f+(h<<2)|0;c[h>>2]=0;i=e;return}else if((f|0)==8){f=c[b+8>>2]|0;h=g+1|0;c[b+4>>2]=h;g=f+(g<<2)|0;c[g>>2]=d;h=f+(h<<2)|0;c[h>>2]=0;i=e;return}}function dj(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0;m=i;if((1073741806-d|0)>>>0<e>>>0){Ii(0)}if((a[b]&1)==0){l=b+4|0}else{l=c[b+8>>2]|0}if(d>>>0<536870887){n=e+d|0;e=d<<1;e=n>>>0<e>>>0?e:n;if(e>>>0<2){e=2}else{e=e+4&-4}}else{e=1073741807}n=hr(e<<2)|0;if((g|0)!=0){Fq(n,l,g)|0}if((j|0)!=0){Fq(n+(g<<2)|0,k,j)|0}k=f-h|0;if((k|0)!=(g|0)){Fq(n+(j+g<<2)|0,l+(h+g<<2)|0,k-g|0)|0}if((d|0)==1){f=b+8|0;c[f>>2]=n;e=e|1;c[b>>2]=e;e=k+j|0;f=b+4|0;c[f>>2]=e;n=n+(e<<2)|0;c[n>>2]=0;i=m;return}jr(l);f=b+8|0;c[f>>2]=n;e=e|1;c[b>>2]=e;e=k+j|0;f=b+4|0;c[f>>2]=e;n=n+(e<<2)|0;c[n>>2]=0;i=m;return}function ej(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0;l=i;if((1073741807-d|0)>>>0<e>>>0){Ii(0)}if((a[b]&1)==0){k=b+4|0}else{k=c[b+8>>2]|0}if(d>>>0<536870887){m=e+d|0;e=d<<1;e=m>>>0<e>>>0?e:m;if(e>>>0<2){e=2}else{e=e+4&-4}}else{e=1073741807}m=hr(e<<2)|0;if((g|0)!=0){Fq(m,k,g)|0}f=f-h|0;if((f|0)!=(g|0)){Fq(m+(j+g<<2)|0,k+(h+g<<2)|0,f-g|0)|0}if((d|0)==1){f=b+8|0;c[f>>2]=m;m=e|1;c[b>>2]=m;i=l;return}jr(k);f=b+8|0;c[f>>2]=m;m=e|1;c[b>>2]=m;i=l;return}function fj(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;g=i;i=i+16|0;f=g+8|0;e=g;h=(c[b+24>>2]|0)==0;if(h){c[b+16>>2]=d|1}else{c[b+16>>2]=d}if(((h&1|d)&c[b+20>>2]|0)==0){i=g;return}d=wb(16)|0;if((a[25128]|0)==0?(Fa(25128)|0)!=0:0){c[6280]=25824;jc(50,25120,p|0)|0;cb(25128)}b=e;c[b>>2]=1;c[b+4>>2]=25120;c[f+0>>2]=c[e+0>>2];c[f+4>>2]=c[e+4>>2];Ei(d,f,25176);c[d>>2]=25144;ec(d|0,25224,46)}function gj(a){a=a|0;var b=0,d=0,e=0,f=0;e=i;c[a>>2]=25168;f=c[a+40>>2]|0;b=a+32|0;d=a+36|0;if((f|0)!=0){do{f=f+ -1|0;uc[c[(c[b>>2]|0)+(f<<2)>>2]&7](0,a,c[(c[d>>2]|0)+(f<<2)>>2]|0)}while((f|0)!=0)}ro(a+28|0);dr(c[b>>2]|0);dr(c[d>>2]|0);dr(c[a+48>>2]|0);dr(c[a+60>>2]|0);i=e;return}function hj(a,b){a=a|0;b=b|0;var c=0;c=i;qo(a,b+28|0);i=c;return}function ij(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;c[a+24>>2]=b;c[a+16>>2]=(b|0)==0;c[a+20>>2]=0;c[a+4>>2]=4098;c[a+12>>2]=0;c[a+8>>2]=6;b=a+28|0;e=a+32|0;a=e+40|0;do{c[e>>2]=0;e=e+4|0}while((e|0)<(a|0));po(b);i=d;return}function jj(a){a=a|0;var b=0;b=i;c[a>>2]=24784;ro(a+4|0);jr(a);i=b;return}function kj(a){a=a|0;var b=0;b=i;c[a>>2]=24784;ro(a+4|0);i=b;return}function lj(a,b){a=a|0;b=b|0;return}function mj(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function nj(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function oj(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=a;c[e>>2]=0;c[e+4>>2]=0;e=a+8|0;c[e>>2]=-1;c[e+4>>2]=-1;return}function pj(a){a=a|0;return 0}function qj(a){a=a|0;return 0}function rj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;if((e|0)<=0){k=0;i=f;return k|0}g=b+12|0;h=b+16|0;j=0;while(1){k=c[g>>2]|0;if(k>>>0<(c[h>>2]|0)>>>0){c[g>>2]=k+1;k=a[k]|0}else{k=sc[c[(c[b>>2]|0)+40>>2]&127](b)|0;if((k|0)==-1){e=8;break}k=k&255}a[d]=k;j=j+1|0;if((j|0)<(e|0)){d=d+1|0}else{e=8;break}}if((e|0)==8){i=f;return j|0}return 0}function sj(a){a=a|0;return-1}function tj(a){a=a|0;var b=0,e=0;b=i;if((sc[c[(c[a>>2]|0)+36>>2]&127](a)|0)==-1){a=-1;i=b;return a|0}e=a+12|0;a=c[e>>2]|0;c[e>>2]=a+1;a=d[a]|0;i=b;return a|0}function uj(a,b){a=a|0;b=b|0;return-1}function vj(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;if((f|0)<=0){l=0;i=g;return l|0}j=b+24|0;h=b+28|0;k=0;while(1){l=c[j>>2]|0;if(!(l>>>0<(c[h>>2]|0)>>>0)){if((Bc[c[(c[b>>2]|0)+52>>2]&31](b,d[e]|0)|0)==-1){h=7;break}}else{m=a[e]|0;c[j>>2]=l+1;a[l]=m}k=k+1|0;if((k|0)<(f|0)){e=e+1|0}else{h=7;break}}if((h|0)==7){i=g;return k|0}return 0}function wj(a,b){a=a|0;b=b|0;return-1}function xj(a){a=a|0;var b=0;b=i;c[a>>2]=24848;ro(a+4|0);jr(a);i=b;return}function yj(a){a=a|0;var b=0;b=i;c[a>>2]=24848;ro(a+4|0);i=b;return}function zj(a,b){a=a|0;b=b|0;return}function Aj(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function Bj(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function Cj(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=a;c[e>>2]=0;c[e+4>>2]=0;e=a+8|0;c[e>>2]=-1;c[e+4>>2]=-1;return}function Dj(a){a=a|0;return 0}function Ej(a){a=a|0;return 0}function Fj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;if((d|0)<=0){j=0;i=e;return j|0}g=a+12|0;f=a+16|0;h=0;while(1){j=c[g>>2]|0;if(!(j>>>0<(c[f>>2]|0)>>>0)){j=sc[c[(c[a>>2]|0)+40>>2]&127](a)|0;if((j|0)==-1){a=8;break}}else{c[g>>2]=j+4;j=c[j>>2]|0}c[b>>2]=j;h=h+1|0;if((h|0)>=(d|0)){a=8;break}b=b+4|0}if((a|0)==8){i=e;return h|0}return 0}function Gj(a){a=a|0;return-1}function Hj(a){a=a|0;var b=0,d=0;b=i;if((sc[c[(c[a>>2]|0)+36>>2]&127](a)|0)==-1){a=-1;i=b;return a|0}d=a+12|0;a=c[d>>2]|0;c[d>>2]=a+4;a=c[a>>2]|0;i=b;return a|0}function Ij(a,b){a=a|0;b=b|0;return-1}function Jj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;if((d|0)<=0){j=0;i=e;return j|0}g=a+24|0;f=a+28|0;h=0;while(1){j=c[g>>2]|0;if(!(j>>>0<(c[f>>2]|0)>>>0)){if((Bc[c[(c[a>>2]|0)+52>>2]&31](a,c[b>>2]|0)|0)==-1){f=8;break}}else{k=c[b>>2]|0;c[g>>2]=j+4;c[j>>2]=k}h=h+1|0;if((h|0)>=(d|0)){f=8;break}b=b+4|0}if((f|0)==8){i=e;return h|0}return 0}function Kj(a,b){a=a|0;b=b|0;return-1}function Lj(a){a=a|0;var b=0;b=i;gj(a+8|0);jr(a);i=b;return}function Mj(a){a=a|0;var b=0;b=i;gj(a+8|0);i=b;return}function Nj(a){a=a|0;var b=0,d=0;b=i;d=c[(c[a>>2]|0)+ -12>>2]|0;gj(a+(d+8)|0);jr(a+d|0);i=b;return}function Oj(a){a=a|0;var b=0;b=i;gj(a+((c[(c[a>>2]|0)+ -12>>2]|0)+8)|0);i=b;return}function Pj(b){b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;e=d;f=c[(c[b>>2]|0)+ -12>>2]|0;if((c[b+(f+24)>>2]|0)==0){i=d;return b|0}a[e]=0;c[e+4>>2]=b;if((c[b+(f+16)>>2]|0)==0){g=c[b+(f+72)>>2]|0;if((g|0)!=0){Pj(g)|0;f=c[(c[b>>2]|0)+ -12>>2]|0}a[e]=1;g=c[b+(f+24)>>2]|0;if((sc[c[(c[g>>2]|0)+24>>2]&127](g)|0)==-1){g=c[(c[b>>2]|0)+ -12>>2]|0;fj(b+g|0,c[b+(g+16)>>2]|1)}}_j(e);i=d;return b|0}function Qj(a){a=a|0;var b=0;b=a+16|0;c[b>>2]=c[b>>2]|1;if((c[a+20>>2]&1|0)==0){return}else{Xa()}}function Rj(a){a=a|0;var b=0;b=i;gj(a+8|0);jr(a);i=b;return}function Sj(a){a=a|0;var b=0;b=i;gj(a+8|0);i=b;return}function Tj(a){a=a|0;var b=0,d=0;b=i;d=c[(c[a>>2]|0)+ -12>>2]|0;gj(a+(d+8)|0);jr(a+d|0);i=b;return}function Uj(a){a=a|0;var b=0;b=i;gj(a+((c[(c[a>>2]|0)+ -12>>2]|0)+8)|0);i=b;return}function Vj(b){b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;e=d;f=c[(c[b>>2]|0)+ -12>>2]|0;if((c[b+(f+24)>>2]|0)==0){i=d;return b|0}a[e]=0;c[e+4>>2]=b;if((c[b+(f+16)>>2]|0)==0){g=c[b+(f+72)>>2]|0;if((g|0)!=0){Vj(g)|0;f=c[(c[b>>2]|0)+ -12>>2]|0}a[e]=1;g=c[b+(f+24)>>2]|0;if((sc[c[(c[g>>2]|0)+24>>2]&127](g)|0)==-1){g=c[(c[b>>2]|0)+ -12>>2]|0;fj(b+g|0,c[b+(g+16)>>2]|1)}}dk(e);i=d;return b|0}function Wj(a){a=a|0;var b=0;b=i;gj(a+4|0);jr(a);i=b;return}function Xj(a){a=a|0;var b=0;b=i;gj(a+4|0);i=b;return}function Yj(a){a=a|0;var b=0,d=0;b=i;d=c[(c[a>>2]|0)+ -12>>2]|0;gj(a+(d+4)|0);jr(a+d|0);i=b;return}function Zj(a){a=a|0;var b=0;b=i;gj(a+((c[(c[a>>2]|0)+ -12>>2]|0)+4)|0);i=b;return}function _j(a){a=a|0;var b=0,d=0,e=0;b=i;a=a+4|0;d=c[a>>2]|0;e=c[(c[d>>2]|0)+ -12>>2]|0;if((c[d+(e+24)>>2]|0)==0){i=b;return}if((c[d+(e+16)>>2]|0)!=0){i=b;return}if((c[d+(e+4)>>2]&8192|0)==0){i=b;return}if(Ia()|0){i=b;return}e=c[a>>2]|0;e=c[e+((c[(c[e>>2]|0)+ -12>>2]|0)+24)>>2]|0;if(!((sc[c[(c[e>>2]|0)+24>>2]&127](e)|0)==-1)){i=b;return}d=c[a>>2]|0;e=c[(c[d>>2]|0)+ -12>>2]|0;fj(d+e|0,c[d+(e+16)>>2]|1);i=b;return}function $j(a){a=a|0;var b=0;b=i;gj(a+4|0);jr(a);i=b;return}function ak(a){a=a|0;var b=0;b=i;gj(a+4|0);i=b;return}function bk(a){a=a|0;var b=0,d=0;b=i;d=c[(c[a>>2]|0)+ -12>>2]|0;gj(a+(d+4)|0);jr(a+d|0);i=b;return}function ck(a){a=a|0;var b=0;b=i;gj(a+((c[(c[a>>2]|0)+ -12>>2]|0)+4)|0);i=b;return}function dk(a){a=a|0;var b=0,d=0,e=0;b=i;a=a+4|0;d=c[a>>2]|0;e=c[(c[d>>2]|0)+ -12>>2]|0;if((c[d+(e+24)>>2]|0)==0){i=b;return}if((c[d+(e+16)>>2]|0)!=0){i=b;return}if((c[d+(e+4)>>2]&8192|0)==0){i=b;return}if(Ia()|0){i=b;return}e=c[a>>2]|0;e=c[e+((c[(c[e>>2]|0)+ -12>>2]|0)+24)>>2]|0;if(!((sc[c[(c[e>>2]|0)+24>>2]&127](e)|0)==-1)){i=b;return}d=c[a>>2]|0;e=c[(c[d>>2]|0)+ -12>>2]|0;fj(d+e|0,c[d+(e+16)>>2]|1);i=b;return}function ek(a){a=a|0;return 25064}function fk(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=i;if((c|0)==1){Li(a,25080,35);i=d;return}else{Ci(a,b,c);i=d;return}}function gk(a){a=a|0;return}function hk(a){a=a|0;var b=0;b=i;Gi(a);jr(a);i=b;return}function ik(a){a=a|0;var b=0;b=i;Gi(a);i=b;return}function jk(a){a=a|0;var b=0;b=i;gj(a);jr(a);i=b;return}function kk(a){a=a|0;var b=0;b=i;jr(a);i=b;return}function lk(a){a=a|0;var b=0;b=i;jr(a);i=b;return}function mk(a){a=a|0;return}function nk(a){a=a|0;return}function ok(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;b=i;a:do{if((e|0)==(f|0)){g=6}else{while(1){if((c|0)==(d|0)){d=-1;break a}j=a[c]|0;h=a[e]|0;if(j<<24>>24<h<<24>>24){d=-1;break a}if(h<<24>>24<j<<24>>24){d=1;break a}c=c+1|0;e=e+1|0;if((e|0)==(f|0)){g=6;break}}}}while(0);if((g|0)==6){d=(c|0)!=(d|0)|0}i=b;return d|0}function pk(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0;d=i;g=e;h=f-g|0;if(h>>>0>4294967279){Ii(b)}if(h>>>0<11){a[b]=h<<1;b=b+1|0}else{k=h+16&-16;j=hr(k)|0;c[b+8>>2]=j;c[b>>2]=k|1;c[b+4>>2]=h;b=j}if((e|0)==(f|0)){k=b;a[k]=0;i=d;return}else{h=b}while(1){a[h]=a[e]|0;e=e+1|0;if((e|0)==(f|0)){break}else{h=h+1|0}}k=b+(f+(0-g))|0;a[k]=0;i=d;return}function qk(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0;b=i;if((c|0)==(d|0)){c=0;i=b;return c|0}else{e=0}do{e=(a[c]|0)+(e<<4)|0;f=e&-268435456;e=(f>>>24|f)^e;c=c+1|0}while((c|0)!=(d|0));i=b;return e|0}function rk(a){a=a|0;var b=0;b=i;jr(a);i=b;return}function sk(a){a=a|0;return}function tk(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;a=i;a:do{if((e|0)==(f|0)){g=6}else{while(1){if((b|0)==(d|0)){d=-1;break a}j=c[b>>2]|0;h=c[e>>2]|0;if((j|0)<(h|0)){d=-1;break a}if((h|0)<(j|0)){d=1;break a}b=b+4|0;e=e+4|0;if((e|0)==(f|0)){g=6;break}}}}while(0);if((g|0)==6){d=(b|0)!=(d|0)|0}i=a;return d|0}function uk(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0;d=i;g=e;j=f-g|0;h=j>>2;if(h>>>0>1073741807){Ii(b)}if(h>>>0<2){a[b]=j>>>1;b=b+4|0}else{k=h+4&-4;j=hr(k<<2)|0;c[b+8>>2]=j;c[b>>2]=k|1;c[b+4>>2]=h;b=j}if((e|0)==(f|0)){k=b;c[k>>2]=0;i=d;return}g=f+ -4+(0-g)|0;h=b;while(1){c[h>>2]=c[e>>2];e=e+4|0;if((e|0)==(f|0)){break}else{h=h+4|0}}k=b+((g>>>2)+1<<2)|0;c[k>>2]=0;i=d;return}function vk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;a=i;if((b|0)==(d|0)){b=0;i=a;return b|0}else{e=0}do{e=(c[b>>2]|0)+(e<<4)|0;f=e&-268435456;e=(f>>>24|f)^e;b=b+4|0}while((b|0)!=(d|0));i=a;return e|0}function wk(a){a=a|0;var b=0;b=i;jr(a);i=b;return}function xk(a){a=a|0;return}function yk(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;k=i;i=i+80|0;l=k;s=k+64|0;q=k+60|0;r=k+56|0;u=k+52|0;t=k+48|0;p=k+44|0;m=k+40|0;n=k+16|0;o=k+12|0;if((c[g+4>>2]&1|0)==0){c[q>>2]=-1;p=c[(c[d>>2]|0)+16>>2]|0;c[u>>2]=c[e>>2];c[t>>2]=c[f>>2];c[s+0>>2]=c[u+0>>2];c[l+0>>2]=c[t+0>>2];nc[p&63](r,d,s,l,g,h,q);l=c[r>>2]|0;c[e>>2]=l;e=c[q>>2]|0;if((e|0)==0){a[j]=0}else if((e|0)==1){a[j]=1}else{a[j]=1;c[h>>2]=4}c[b>>2]=l;i=k;return}hj(p,g);q=c[p>>2]|0;if(!((c[6878]|0)==-1)){c[l>>2]=27512;c[l+4>>2]=122;c[l+8>>2]=0;Hi(27512,l,123)}d=(c[27516>>2]|0)+ -1|0;r=c[q+8>>2]|0;if(!((c[q+12>>2]|0)-r>>2>>>0>d>>>0)){u=wb(4)|0;Jq(u);ec(u|0,35472,111)}q=c[r+(d<<2)>>2]|0;if((q|0)==0){u=wb(4)|0;Jq(u);ec(u|0,35472,111)}li(c[p>>2]|0)|0;hj(m,g);g=c[m>>2]|0;if(!((c[6914]|0)==-1)){c[l>>2]=27656;c[l+4>>2]=122;c[l+8>>2]=0;Hi(27656,l,123)}r=(c[27660>>2]|0)+ -1|0;p=c[g+8>>2]|0;if(!((c[g+12>>2]|0)-p>>2>>>0>r>>>0)){u=wb(4)|0;Jq(u);ec(u|0,35472,111)}g=c[p+(r<<2)>>2]|0;if((g|0)==0){u=wb(4)|0;Jq(u);ec(u|0,35472,111)}li(c[m>>2]|0)|0;qc[c[(c[g>>2]|0)+24>>2]&63](n,g);qc[c[(c[g>>2]|0)+28>>2]&63](n+12|0,g);c[o>>2]=c[f>>2];u=n+24|0;c[l+0>>2]=c[o+0>>2];a[j]=(zk(e,l,n,u,q,h,1)|0)==(n|0)|0;c[b>>2]=c[e>>2];Oi(n+12|0);Oi(n);i=k;return}function zk(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;n=i;i=i+112|0;p=n;u=(g-f|0)/12|0;if(u>>>0>100){p=cr(u)|0;if((p|0)==0){or()}else{m=p;o=p}}else{m=0;o=p}p=(f|0)==(g|0);if(p){t=0}else{q=f;t=0;r=o;while(1){s=a[q]|0;if((s&1)==0){s=(s&255)>>>1}else{s=c[q+4>>2]|0}if((s|0)==0){a[r]=2;t=t+1|0;u=u+ -1|0}else{a[r]=1}q=q+12|0;if((q|0)==(g|0)){break}else{r=r+1|0}}}q=0;a:while(1){r=c[b>>2]|0;do{if((r|0)!=0){if((c[r+12>>2]|0)==(c[r+16>>2]|0)){if((sc[c[(c[r>>2]|0)+36>>2]&127](r)|0)==-1){c[b>>2]=0;r=0;break}else{r=c[b>>2]|0;break}}}else{r=0}}while(0);v=(r|0)==0;r=c[e>>2]|0;if((r|0)!=0){if((c[r+12>>2]|0)==(c[r+16>>2]|0)?(sc[c[(c[r>>2]|0)+36>>2]&127](r)|0)==-1:0){c[e>>2]=0;r=0}}else{r=0}s=(r|0)==0;w=c[b>>2]|0;if(!((v^s)&(u|0)!=0)){break}r=c[w+12>>2]|0;if((r|0)==(c[w+16>>2]|0)){r=sc[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{r=d[r]|0}s=r&255;if(!k){s=Bc[c[(c[h>>2]|0)+12>>2]&31](h,s)|0}r=q+1|0;if(p){q=r;continue}b:do{if(k){x=0;v=f;w=o;while(1){do{if((a[w]|0)==1){y=a[v]|0;A=(y&1)==0;if(A){z=v+1|0}else{z=c[v+8>>2]|0}if(!(s<<24>>24==(a[z+q|0]|0))){a[w]=0;u=u+ -1|0;break}if(A){x=(y&255)>>>1}else{x=c[v+4>>2]|0}if((x|0)==(r|0)){a[w]=2;x=1;t=t+1|0;u=u+ -1|0}else{x=1}}}while(0);v=v+12|0;if((v|0)==(g|0)){break b}w=w+1|0}}else{x=0;v=f;w=o;while(1){do{if((a[w]|0)==1){if((a[v]&1)==0){y=v+1|0}else{y=c[v+8>>2]|0}if(!(s<<24>>24==(Bc[c[(c[h>>2]|0)+12>>2]&31](h,a[y+q|0]|0)|0)<<24>>24)){a[w]=0;u=u+ -1|0;break}x=a[v]|0;if((x&1)==0){x=(x&255)>>>1}else{x=c[v+4>>2]|0}if((x|0)==(r|0)){a[w]=2;x=1;t=t+1|0;u=u+ -1|0}else{x=1}}}while(0);v=v+12|0;if((v|0)==(g|0)){break b}w=w+1|0}}}while(0);if(!x){q=r;continue}v=c[b>>2]|0;q=v+12|0;s=c[q>>2]|0;if((s|0)==(c[v+16>>2]|0)){sc[c[(c[v>>2]|0)+40>>2]&127](v)|0}else{c[q>>2]=s+1}if((u+t|0)>>>0<2){q=r;continue}else{s=f;q=o}while(1){if((a[q]|0)==2){v=a[s]|0;if((v&1)==0){v=(v&255)>>>1}else{v=c[s+4>>2]|0}if((v|0)!=(r|0)){a[q]=0;t=t+ -1|0}}s=s+12|0;if((s|0)==(g|0)){q=r;continue a}else{q=q+1|0}}}do{if((w|0)!=0){if((c[w+12>>2]|0)==(c[w+16>>2]|0)){if((sc[c[(c[w>>2]|0)+36>>2]&127](w)|0)==-1){c[b>>2]=0;w=0;break}else{w=c[b>>2]|0;break}}}else{w=0}}while(0);h=(w|0)==0;do{if(!s){if((c[r+12>>2]|0)!=(c[r+16>>2]|0)){if(h){break}else{l=80;break}}if(!((sc[c[(c[r>>2]|0)+36>>2]&127](r)|0)==-1)){if(h){break}else{l=80;break}}else{c[e>>2]=0;l=78;break}}else{l=78}}while(0);if((l|0)==78?h:0){l=80}if((l|0)==80){c[j>>2]=c[j>>2]|2}c:do{if(!p){if((a[o]|0)==2){g=f}else{while(1){f=f+12|0;o=o+1|0;if((f|0)==(g|0)){l=85;break c}if((a[o]|0)==2){g=f;break}}}}else{l=85}}while(0);if((l|0)==85){c[j>>2]=c[j>>2]|4}if((m|0)==0){i=n;return g|0}dr(m);i=n;return g|0}function Ak(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b+8|0;m=b+4|0;l=b;c[m>>2]=c[d>>2];c[l>>2]=c[e>>2];c[k+0>>2]=c[m+0>>2];c[j+0>>2]=c[l+0>>2];Bk(a,0,k,j,f,g,h);i=b;return}function Bk(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;n=i;i=i+224|0;u=n+198|0;v=n+196|0;m=n+184|0;e=n+172|0;s=n+168|0;r=n+8|0;q=n+4|0;p=n;t=c[h+4>>2]&74;if((t|0)==0){t=0}else if((t|0)==64){t=8}else if((t|0)==8){t=16}else{t=10}rl(m,h,u,v);c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;Ri(e,10,0);if((a[e]&1)==0){A=e+1|0;w=A;x=e+8|0}else{A=e+8|0;w=e+1|0;x=A;A=c[A>>2]|0}c[s>>2]=A;c[q>>2]=r;c[p>>2]=0;h=e+4|0;y=a[v]|0;v=c[f>>2]|0;a:while(1){if((v|0)!=0){if((c[v+12>>2]|0)==(c[v+16>>2]|0)?(sc[c[(c[v>>2]|0)+36>>2]&127](v)|0)==-1:0){c[f>>2]=0;v=0}}else{v=0}B=(v|0)==0;z=c[g>>2]|0;do{if((z|0)!=0){if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){if(B){break}else{break a}}if(!((sc[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1)){if(B){break}else{break a}}else{c[g>>2]=0;l=18;break}}else{l=18}}while(0);if((l|0)==18){l=0;if(B){z=0;break}else{z=0}}B=a[e]|0;C=(B&1)==0;if(C){D=(B&255)>>>1}else{D=c[h>>2]|0}if(((c[s>>2]|0)-A|0)==(D|0)){if(C){A=(B&255)>>>1;B=(B&255)>>>1}else{B=c[h>>2]|0;A=B}Ri(e,A<<1,0);if((a[e]&1)==0){A=10}else{A=(c[e>>2]&-2)+ -1|0}Ri(e,A,0);if((a[e]&1)==0){A=w}else{A=c[x>>2]|0}c[s>>2]=A+B}B=v+12|0;D=c[B>>2]|0;C=v+16|0;if((D|0)==(c[C>>2]|0)){D=sc[c[(c[v>>2]|0)+36>>2]&127](v)|0}else{D=d[D]|0}if((Tk(D&255,t,A,s,p,y,m,r,q,u)|0)!=0){break}z=c[B>>2]|0;if((z|0)==(c[C>>2]|0)){sc[c[(c[v>>2]|0)+40>>2]&127](v)|0;continue}else{c[B>>2]=z+1;continue}}u=a[m]|0;if((u&1)==0){u=(u&255)>>>1}else{u=c[m+4>>2]|0}if((u|0)!=0?(o=c[q>>2]|0,(o-r|0)<160):0){D=c[p>>2]|0;c[q>>2]=o+4;c[o>>2]=D}c[k>>2]=nq(A,c[s>>2]|0,j,t)|0;En(m,r,c[q>>2]|0,j);if((v|0)!=0){if((c[v+12>>2]|0)==(c[v+16>>2]|0)?(sc[c[(c[v>>2]|0)+36>>2]&127](v)|0)==-1:0){c[f>>2]=0;v=0}}else{v=0}k=(v|0)==0;do{if((z|0)!=0){if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){if(!k){break}c[b>>2]=v;Oi(e);Oi(m);i=n;return}if((sc[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1){c[g>>2]=0;l=54;break}if(k^(z|0)==0){c[b>>2]=v;Oi(e);Oi(m);i=n;return}}else{l=54}}while(0);if((l|0)==54?!k:0){c[b>>2]=v;Oi(e);Oi(m);i=n;return}c[j>>2]=c[j>>2]|2;c[b>>2]=v;Oi(e);Oi(m);i=n;return}function Ck(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b+8|0;m=b+4|0;l=b;c[m>>2]=c[d>>2];c[l>>2]=c[e>>2];c[k+0>>2]=c[m+0>>2];c[j+0>>2]=c[l+0>>2];Dk(a,0,k,j,f,g,h);i=b;return}function Dk(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;n=i;i=i+224|0;u=n+198|0;v=n+196|0;m=n+184|0;e=n+172|0;s=n+168|0;r=n+8|0;q=n+4|0;p=n;t=c[h+4>>2]&74;if((t|0)==8){t=16}else if((t|0)==0){t=0}else if((t|0)==64){t=8}else{t=10}rl(m,h,u,v);c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;Ri(e,10,0);if((a[e]&1)==0){A=e+1|0;w=A;x=e+8|0}else{A=e+8|0;w=e+1|0;x=A;A=c[A>>2]|0}c[s>>2]=A;c[q>>2]=r;c[p>>2]=0;h=e+4|0;y=a[v]|0;v=c[f>>2]|0;a:while(1){if((v|0)!=0){if((c[v+12>>2]|0)==(c[v+16>>2]|0)?(sc[c[(c[v>>2]|0)+36>>2]&127](v)|0)==-1:0){c[f>>2]=0;v=0}}else{v=0}B=(v|0)==0;z=c[g>>2]|0;do{if((z|0)!=0){if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){if(B){break}else{break a}}if(!((sc[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1)){if(B){break}else{break a}}else{c[g>>2]=0;l=18;break}}else{l=18}}while(0);if((l|0)==18){l=0;if(B){z=0;break}else{z=0}}B=a[e]|0;C=(B&1)==0;if(C){D=(B&255)>>>1}else{D=c[h>>2]|0}if(((c[s>>2]|0)-A|0)==(D|0)){if(C){A=(B&255)>>>1;B=(B&255)>>>1}else{B=c[h>>2]|0;A=B}Ri(e,A<<1,0);if((a[e]&1)==0){A=10}else{A=(c[e>>2]&-2)+ -1|0}Ri(e,A,0);if((a[e]&1)==0){A=w}else{A=c[x>>2]|0}c[s>>2]=A+B}B=v+12|0;D=c[B>>2]|0;C=v+16|0;if((D|0)==(c[C>>2]|0)){D=sc[c[(c[v>>2]|0)+36>>2]&127](v)|0}else{D=d[D]|0}if((Tk(D&255,t,A,s,p,y,m,r,q,u)|0)!=0){break}z=c[B>>2]|0;if((z|0)==(c[C>>2]|0)){sc[c[(c[v>>2]|0)+40>>2]&127](v)|0;continue}else{c[B>>2]=z+1;continue}}u=a[m]|0;if((u&1)==0){u=(u&255)>>>1}else{u=c[m+4>>2]|0}if((u|0)!=0?(o=c[q>>2]|0,(o-r|0)<160):0){D=c[p>>2]|0;c[q>>2]=o+4;c[o>>2]=D}C=mq(A,c[s>>2]|0,j,t)|0;D=k;c[D>>2]=C;c[D+4>>2]=I;En(m,r,c[q>>2]|0,j);if((v|0)!=0){if((c[v+12>>2]|0)==(c[v+16>>2]|0)?(sc[c[(c[v>>2]|0)+36>>2]&127](v)|0)==-1:0){c[f>>2]=0;v=0}}else{v=0}k=(v|0)==0;do{if((z|0)!=0){if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){if(!k){break}c[b>>2]=v;Oi(e);Oi(m);i=n;return}if((sc[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1){c[g>>2]=0;l=54;break}if(k^(z|0)==0){c[b>>2]=v;Oi(e);Oi(m);i=n;return}}else{l=54}}while(0);if((l|0)==54?!k:0){c[b>>2]=v;Oi(e);Oi(m);i=n;return}c[j>>2]=c[j>>2]|2;c[b>>2]=v;Oi(e);Oi(m);i=n;return}function Ek(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b+8|0;m=b+4|0;l=b;c[m>>2]=c[d>>2];c[l>>2]=c[e>>2];c[k+0>>2]=c[m+0>>2];c[j+0>>2]=c[l+0>>2];Fk(a,0,k,j,f,g,h);i=b;return}function Fk(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;o=i;i=i+224|0;v=o+198|0;w=o+196|0;n=o+184|0;f=o+172|0;t=o+168|0;s=o+8|0;r=o+4|0;q=o;u=c[j+4>>2]&74;if((u|0)==0){u=0}else if((u|0)==8){u=16}else if((u|0)==64){u=8}else{u=10}rl(n,j,v,w);c[f+0>>2]=0;c[f+4>>2]=0;c[f+8>>2]=0;Ri(f,10,0);if((a[f]&1)==0){B=f+1|0;x=B;y=f+8|0}else{B=f+8|0;x=f+1|0;y=B;B=c[B>>2]|0}c[t>>2]=B;c[r>>2]=s;c[q>>2]=0;j=f+4|0;z=a[w]|0;w=c[g>>2]|0;a:while(1){if((w|0)!=0){if((c[w+12>>2]|0)==(c[w+16>>2]|0)?(sc[c[(c[w>>2]|0)+36>>2]&127](w)|0)==-1:0){c[g>>2]=0;w=0}}else{w=0}C=(w|0)==0;A=c[h>>2]|0;do{if((A|0)!=0){if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){if(C){break}else{break a}}if(!((sc[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1)){if(C){break}else{break a}}else{c[h>>2]=0;m=18;break}}else{m=18}}while(0);if((m|0)==18){m=0;if(C){A=0;break}else{A=0}}C=a[f]|0;D=(C&1)==0;if(D){E=(C&255)>>>1}else{E=c[j>>2]|0}if(((c[t>>2]|0)-B|0)==(E|0)){if(D){B=(C&255)>>>1;C=(C&255)>>>1}else{C=c[j>>2]|0;B=C}Ri(f,B<<1,0);if((a[f]&1)==0){B=10}else{B=(c[f>>2]&-2)+ -1|0}Ri(f,B,0);if((a[f]&1)==0){B=x}else{B=c[y>>2]|0}c[t>>2]=B+C}C=w+12|0;E=c[C>>2]|0;D=w+16|0;if((E|0)==(c[D>>2]|0)){E=sc[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{E=d[E]|0}if((Tk(E&255,u,B,t,q,z,n,s,r,v)|0)!=0){break}A=c[C>>2]|0;if((A|0)==(c[D>>2]|0)){sc[c[(c[w>>2]|0)+40>>2]&127](w)|0;continue}else{c[C>>2]=A+1;continue}}v=a[n]|0;if((v&1)==0){v=(v&255)>>>1}else{v=c[n+4>>2]|0}if((v|0)!=0?(p=c[r>>2]|0,(p-s|0)<160):0){E=c[q>>2]|0;c[r>>2]=p+4;c[p>>2]=E}b[l>>1]=lq(B,c[t>>2]|0,k,u)|0;En(n,s,c[r>>2]|0,k);if((w|0)!=0){if((c[w+12>>2]|0)==(c[w+16>>2]|0)?(sc[c[(c[w>>2]|0)+36>>2]&127](w)|0)==-1:0){c[g>>2]=0;w=0}}else{w=0}l=(w|0)==0;do{if((A|0)!=0){if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){if(!l){break}c[e>>2]=w;Oi(f);Oi(n);i=o;return}if((sc[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1){c[h>>2]=0;m=54;break}if(l^(A|0)==0){c[e>>2]=w;Oi(f);Oi(n);i=o;return}}else{m=54}}while(0);if((m|0)==54?!l:0){c[e>>2]=w;Oi(f);Oi(n);i=o;return}c[k>>2]=c[k>>2]|2;c[e>>2]=w;Oi(f);Oi(n);i=o;return}function Gk(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b+8|0;m=b+4|0;l=b;c[m>>2]=c[d>>2];c[l>>2]=c[e>>2];c[k+0>>2]=c[m+0>>2];c[j+0>>2]=c[l+0>>2];Hk(a,0,k,j,f,g,h);i=b;return}function Hk(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;n=i;i=i+224|0;u=n+198|0;v=n+196|0;m=n+184|0;e=n+172|0;s=n+168|0;r=n+8|0;q=n+4|0;p=n;t=c[h+4>>2]&74;if((t|0)==0){t=0}else if((t|0)==8){t=16}else if((t|0)==64){t=8}else{t=10}rl(m,h,u,v);c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;Ri(e,10,0);if((a[e]&1)==0){A=e+1|0;w=A;x=e+8|0}else{A=e+8|0;w=e+1|0;x=A;A=c[A>>2]|0}c[s>>2]=A;c[q>>2]=r;c[p>>2]=0;h=e+4|0;y=a[v]|0;v=c[f>>2]|0;a:while(1){if((v|0)!=0){if((c[v+12>>2]|0)==(c[v+16>>2]|0)?(sc[c[(c[v>>2]|0)+36>>2]&127](v)|0)==-1:0){c[f>>2]=0;v=0}}else{v=0}B=(v|0)==0;z=c[g>>2]|0;do{if((z|0)!=0){if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){if(B){break}else{break a}}if(!((sc[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1)){if(B){break}else{break a}}else{c[g>>2]=0;l=18;break}}else{l=18}}while(0);if((l|0)==18){l=0;if(B){z=0;break}else{z=0}}B=a[e]|0;C=(B&1)==0;if(C){D=(B&255)>>>1}else{D=c[h>>2]|0}if(((c[s>>2]|0)-A|0)==(D|0)){if(C){A=(B&255)>>>1;B=(B&255)>>>1}else{B=c[h>>2]|0;A=B}Ri(e,A<<1,0);if((a[e]&1)==0){A=10}else{A=(c[e>>2]&-2)+ -1|0}Ri(e,A,0);if((a[e]&1)==0){A=w}else{A=c[x>>2]|0}c[s>>2]=A+B}B=v+12|0;D=c[B>>2]|0;C=v+16|0;if((D|0)==(c[C>>2]|0)){D=sc[c[(c[v>>2]|0)+36>>2]&127](v)|0}else{D=d[D]|0}if((Tk(D&255,t,A,s,p,y,m,r,q,u)|0)!=0){break}z=c[B>>2]|0;if((z|0)==(c[C>>2]|0)){sc[c[(c[v>>2]|0)+40>>2]&127](v)|0;continue}else{c[B>>2]=z+1;continue}}u=a[m]|0;if((u&1)==0){u=(u&255)>>>1}else{u=c[m+4>>2]|0}if((u|0)!=0?(o=c[q>>2]|0,(o-r|0)<160):0){D=c[p>>2]|0;c[q>>2]=o+4;c[o>>2]=D}c[k>>2]=kq(A,c[s>>2]|0,j,t)|0;En(m,r,c[q>>2]|0,j);if((v|0)!=0){if((c[v+12>>2]|0)==(c[v+16>>2]|0)?(sc[c[(c[v>>2]|0)+36>>2]&127](v)|0)==-1:0){c[f>>2]=0;v=0}}else{v=0}k=(v|0)==0;do{if((z|0)!=0){if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){if(!k){break}c[b>>2]=v;Oi(e);Oi(m);i=n;return}if((sc[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1){c[g>>2]=0;l=54;break}if(k^(z|0)==0){c[b>>2]=v;Oi(e);Oi(m);i=n;return}}else{l=54}}while(0);if((l|0)==54?!k:0){c[b>>2]=v;Oi(e);Oi(m);i=n;return}c[j>>2]=c[j>>2]|2;c[b>>2]=v;Oi(e);Oi(m);i=n;return}function Ik(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b+8|0;m=b+4|0;l=b;c[m>>2]=c[d>>2];c[l>>2]=c[e>>2];c[k+0>>2]=c[m+0>>2];c[j+0>>2]=c[l+0>>2];Jk(a,0,k,j,f,g,h);i=b;return}function Jk(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;n=i;i=i+224|0;u=n+198|0;v=n+196|0;m=n+184|0;e=n+172|0;s=n+168|0;r=n+8|0;q=n+4|0;p=n;t=c[h+4>>2]&74;if((t|0)==0){t=0}else if((t|0)==64){t=8}else if((t|0)==8){t=16}else{t=10}rl(m,h,u,v);c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;Ri(e,10,0);if((a[e]&1)==0){A=e+1|0;w=A;x=e+8|0}else{A=e+8|0;w=e+1|0;x=A;A=c[A>>2]|0}c[s>>2]=A;c[q>>2]=r;c[p>>2]=0;h=e+4|0;y=a[v]|0;v=c[f>>2]|0;a:while(1){if((v|0)!=0){if((c[v+12>>2]|0)==(c[v+16>>2]|0)?(sc[c[(c[v>>2]|0)+36>>2]&127](v)|0)==-1:0){c[f>>2]=0;v=0}}else{v=0}B=(v|0)==0;z=c[g>>2]|0;do{if((z|0)!=0){if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){if(B){break}else{break a}}if(!((sc[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1)){if(B){break}else{break a}}else{c[g>>2]=0;l=18;break}}else{l=18}}while(0);if((l|0)==18){l=0;if(B){z=0;break}else{z=0}}B=a[e]|0;C=(B&1)==0;if(C){D=(B&255)>>>1}else{D=c[h>>2]|0}if(((c[s>>2]|0)-A|0)==(D|0)){if(C){A=(B&255)>>>1;B=(B&255)>>>1}else{B=c[h>>2]|0;A=B}Ri(e,A<<1,0);if((a[e]&1)==0){A=10}else{A=(c[e>>2]&-2)+ -1|0}Ri(e,A,0);if((a[e]&1)==0){A=w}else{A=c[x>>2]|0}c[s>>2]=A+B}B=v+12|0;D=c[B>>2]|0;C=v+16|0;if((D|0)==(c[C>>2]|0)){D=sc[c[(c[v>>2]|0)+36>>2]&127](v)|0}else{D=d[D]|0}if((Tk(D&255,t,A,s,p,y,m,r,q,u)|0)!=0){break}z=c[B>>2]|0;if((z|0)==(c[C>>2]|0)){sc[c[(c[v>>2]|0)+40>>2]&127](v)|0;continue}else{c[B>>2]=z+1;continue}}u=a[m]|0;if((u&1)==0){u=(u&255)>>>1}else{u=c[m+4>>2]|0}if((u|0)!=0?(o=c[q>>2]|0,(o-r|0)<160):0){D=c[p>>2]|0;c[q>>2]=o+4;c[o>>2]=D}c[k>>2]=jq(A,c[s>>2]|0,j,t)|0;En(m,r,c[q>>2]|0,j);if((v|0)!=0){if((c[v+12>>2]|0)==(c[v+16>>2]|0)?(sc[c[(c[v>>2]|0)+36>>2]&127](v)|0)==-1:0){c[f>>2]=0;v=0}}else{v=0}k=(v|0)==0;do{if((z|0)!=0){if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){if(!k){break}c[b>>2]=v;Oi(e);Oi(m);i=n;return}if((sc[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1){c[g>>2]=0;l=54;break}if(k^(z|0)==0){c[b>>2]=v;Oi(e);Oi(m);i=n;return}}else{l=54}}while(0);if((l|0)==54?!k:0){c[b>>2]=v;Oi(e);Oi(m);i=n;return}c[j>>2]=c[j>>2]|2;c[b>>2]=v;Oi(e);Oi(m);i=n;return}function Kk(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b+8|0;m=b+4|0;l=b;c[m>>2]=c[d>>2];c[l>>2]=c[e>>2];c[k+0>>2]=c[m+0>>2];c[j+0>>2]=c[l+0>>2];Lk(a,0,k,j,f,g,h);i=b;return}function Lk(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;n=i;i=i+224|0;u=n+198|0;v=n+196|0;m=n+184|0;e=n+172|0;s=n+168|0;r=n+8|0;q=n+4|0;p=n;t=c[h+4>>2]&74;if((t|0)==0){t=0}else if((t|0)==64){t=8}else if((t|0)==8){t=16}else{t=10}rl(m,h,u,v);c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;Ri(e,10,0);if((a[e]&1)==0){A=e+1|0;w=A;x=e+8|0}else{A=e+8|0;w=e+1|0;x=A;A=c[A>>2]|0}c[s>>2]=A;c[q>>2]=r;c[p>>2]=0;h=e+4|0;y=a[v]|0;v=c[f>>2]|0;a:while(1){if((v|0)!=0){if((c[v+12>>2]|0)==(c[v+16>>2]|0)?(sc[c[(c[v>>2]|0)+36>>2]&127](v)|0)==-1:0){c[f>>2]=0;v=0}}else{v=0}B=(v|0)==0;z=c[g>>2]|0;do{if((z|0)!=0){if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){if(B){break}else{break a}}if(!((sc[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1)){if(B){break}else{break a}}else{c[g>>2]=0;l=18;break}}else{l=18}}while(0);if((l|0)==18){l=0;if(B){z=0;break}else{z=0}}B=a[e]|0;C=(B&1)==0;if(C){D=(B&255)>>>1}else{D=c[h>>2]|0}if(((c[s>>2]|0)-A|0)==(D|0)){if(C){A=(B&255)>>>1;B=(B&255)>>>1}else{B=c[h>>2]|0;A=B}Ri(e,A<<1,0);if((a[e]&1)==0){A=10}else{A=(c[e>>2]&-2)+ -1|0}Ri(e,A,0);if((a[e]&1)==0){A=w}else{A=c[x>>2]|0}c[s>>2]=A+B}B=v+12|0;D=c[B>>2]|0;C=v+16|0;if((D|0)==(c[C>>2]|0)){D=sc[c[(c[v>>2]|0)+36>>2]&127](v)|0}else{D=d[D]|0}if((Tk(D&255,t,A,s,p,y,m,r,q,u)|0)!=0){break}z=c[B>>2]|0;if((z|0)==(c[C>>2]|0)){sc[c[(c[v>>2]|0)+40>>2]&127](v)|0;continue}else{c[B>>2]=z+1;continue}}u=a[m]|0;if((u&1)==0){u=(u&255)>>>1}else{u=c[m+4>>2]|0}if((u|0)!=0?(o=c[q>>2]|0,(o-r|0)<160):0){D=c[p>>2]|0;c[q>>2]=o+4;c[o>>2]=D}C=iq(A,c[s>>2]|0,j,t)|0;D=k;c[D>>2]=C;c[D+4>>2]=I;En(m,r,c[q>>2]|0,j);if((v|0)!=0){if((c[v+12>>2]|0)==(c[v+16>>2]|0)?(sc[c[(c[v>>2]|0)+36>>2]&127](v)|0)==-1:0){c[f>>2]=0;v=0}}else{v=0}k=(v|0)==0;do{if((z|0)!=0){if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){if(!k){break}c[b>>2]=v;Oi(e);Oi(m);i=n;return}if((sc[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1){c[g>>2]=0;l=54;break}if(k^(z|0)==0){c[b>>2]=v;Oi(e);Oi(m);i=n;return}}else{l=54}}while(0);if((l|0)==54?!k:0){c[b>>2]=v;Oi(e);Oi(m);i=n;return}c[j>>2]=c[j>>2]|2;c[b>>2]=v;Oi(e);Oi(m);i=n;return}function Mk(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b+8|0;m=b+4|0;l=b;c[m>>2]=c[d>>2];c[l>>2]=c[e>>2];c[k+0>>2]=c[m+0>>2];c[j+0>>2]=c[l+0>>2];Nk(a,0,k,j,f,g,h);i=b;return}function Nk(b,e,f,h,j,k,l){b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;o=i;i=i+240|0;w=o+200|0;A=o+199|0;x=o+198|0;n=o+184|0;e=o+172|0;r=o+168|0;s=o+8|0;u=o+4|0;t=o;q=o+197|0;v=o+196|0;sl(n,j,w,A,x);c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;Ri(e,10,0);if((a[e]&1)==0){D=e+1|0;y=D;z=e+8|0}else{D=e+8|0;y=e+1|0;z=D;D=c[D>>2]|0}c[r>>2]=D;c[u>>2]=s;c[t>>2]=0;a[q]=1;a[v]=69;j=e+4|0;A=a[A]|0;B=a[x]|0;x=c[f>>2]|0;a:while(1){if((x|0)!=0){if((c[x+12>>2]|0)==(c[x+16>>2]|0)?(sc[c[(c[x>>2]|0)+36>>2]&127](x)|0)==-1:0){c[f>>2]=0;x=0}}else{x=0}E=(x|0)==0;C=c[h>>2]|0;do{if((C|0)!=0){if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){if(E){break}else{break a}}if(!((sc[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1)){if(E){break}else{break a}}else{c[h>>2]=0;m=14;break}}else{m=14}}while(0);if((m|0)==14){m=0;if(E){C=0;break}else{C=0}}E=a[e]|0;G=(E&1)==0;if(G){F=(E&255)>>>1}else{F=c[j>>2]|0}if(((c[r>>2]|0)-D|0)==(F|0)){if(G){D=(E&255)>>>1;E=(E&255)>>>1}else{E=c[j>>2]|0;D=E}Ri(e,D<<1,0);if((a[e]&1)==0){D=10}else{D=(c[e>>2]&-2)+ -1|0}Ri(e,D,0);if((a[e]&1)==0){D=y}else{D=c[z>>2]|0}c[r>>2]=D+E}F=x+12|0;G=c[F>>2]|0;E=x+16|0;if((G|0)==(c[E>>2]|0)){G=sc[c[(c[x>>2]|0)+36>>2]&127](x)|0}else{G=d[G]|0}if((tl(G&255,q,v,D,r,A,B,n,s,u,t,w)|0)!=0){break}C=c[F>>2]|0;if((C|0)==(c[E>>2]|0)){sc[c[(c[x>>2]|0)+40>>2]&127](x)|0;continue}else{c[F>>2]=C+1;continue}}v=a[n]|0;if((v&1)==0){v=(v&255)>>>1}else{v=c[n+4>>2]|0}if(((v|0)!=0?(a[q]|0)!=0:0)?(p=c[u>>2]|0,(p-s|0)<160):0){G=c[t>>2]|0;c[u>>2]=p+4;c[p>>2]=G}g[l>>2]=+hq(D,c[r>>2]|0,k);En(n,s,c[u>>2]|0,k);if((x|0)!=0){if((c[x+12>>2]|0)==(c[x+16>>2]|0)?(sc[c[(c[x>>2]|0)+36>>2]&127](x)|0)==-1:0){c[f>>2]=0;x=0}}else{x=0}p=(x|0)==0;do{if((C|0)!=0){if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){if(!p){break}c[b>>2]=x;Oi(e);Oi(n);i=o;return}if((sc[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1){c[h>>2]=0;m=51;break}if(p^(C|0)==0){c[b>>2]=x;Oi(e);Oi(n);i=o;return}}else{m=51}}while(0);if((m|0)==51?!p:0){c[b>>2]=x;Oi(e);Oi(n);i=o;return}c[k>>2]=c[k>>2]|2;c[b>>2]=x;Oi(e);Oi(n);i=o;return}function Ok(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b+8|0;m=b+4|0;l=b;c[m>>2]=c[d>>2];c[l>>2]=c[e>>2];c[k+0>>2]=c[m+0>>2];c[j+0>>2]=c[l+0>>2];Pk(a,0,k,j,f,g,h);i=b;return}function Pk(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;o=i;i=i+240|0;w=o+200|0;A=o+199|0;x=o+198|0;n=o+184|0;e=o+172|0;r=o+168|0;s=o+8|0;u=o+4|0;t=o;q=o+197|0;v=o+196|0;sl(n,j,w,A,x);c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;Ri(e,10,0);if((a[e]&1)==0){D=e+1|0;y=D;z=e+8|0}else{D=e+8|0;y=e+1|0;z=D;D=c[D>>2]|0}c[r>>2]=D;c[u>>2]=s;c[t>>2]=0;a[q]=1;a[v]=69;j=e+4|0;A=a[A]|0;B=a[x]|0;x=c[f>>2]|0;a:while(1){if((x|0)!=0){if((c[x+12>>2]|0)==(c[x+16>>2]|0)?(sc[c[(c[x>>2]|0)+36>>2]&127](x)|0)==-1:0){c[f>>2]=0;x=0}}else{x=0}E=(x|0)==0;C=c[g>>2]|0;do{if((C|0)!=0){if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){if(E){break}else{break a}}if(!((sc[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1)){if(E){break}else{break a}}else{c[g>>2]=0;m=14;break}}else{m=14}}while(0);if((m|0)==14){m=0;if(E){C=0;break}else{C=0}}E=a[e]|0;G=(E&1)==0;if(G){F=(E&255)>>>1}else{F=c[j>>2]|0}if(((c[r>>2]|0)-D|0)==(F|0)){if(G){D=(E&255)>>>1;E=(E&255)>>>1}else{E=c[j>>2]|0;D=E}Ri(e,D<<1,0);if((a[e]&1)==0){D=10}else{D=(c[e>>2]&-2)+ -1|0}Ri(e,D,0);if((a[e]&1)==0){D=y}else{D=c[z>>2]|0}c[r>>2]=D+E}F=x+12|0;G=c[F>>2]|0;E=x+16|0;if((G|0)==(c[E>>2]|0)){G=sc[c[(c[x>>2]|0)+36>>2]&127](x)|0}else{G=d[G]|0}if((tl(G&255,q,v,D,r,A,B,n,s,u,t,w)|0)!=0){break}C=c[F>>2]|0;if((C|0)==(c[E>>2]|0)){sc[c[(c[x>>2]|0)+40>>2]&127](x)|0;continue}else{c[F>>2]=C+1;continue}}v=a[n]|0;if((v&1)==0){v=(v&255)>>>1}else{v=c[n+4>>2]|0}if(((v|0)!=0?(a[q]|0)!=0:0)?(p=c[u>>2]|0,(p-s|0)<160):0){G=c[t>>2]|0;c[u>>2]=p+4;c[p>>2]=G}h[l>>3]=+gq(D,c[r>>2]|0,k);En(n,s,c[u>>2]|0,k);if((x|0)!=0){if((c[x+12>>2]|0)==(c[x+16>>2]|0)?(sc[c[(c[x>>2]|0)+36>>2]&127](x)|0)==-1:0){c[f>>2]=0;x=0}}else{x=0}p=(x|0)==0;do{if((C|0)!=0){if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){if(!p){break}c[b>>2]=x;Oi(e);Oi(n);i=o;return}if((sc[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1){c[g>>2]=0;m=51;break}if(p^(C|0)==0){c[b>>2]=x;Oi(e);Oi(n);i=o;return}}else{m=51}}while(0);if((m|0)==51?!p:0){c[b>>2]=x;Oi(e);Oi(n);i=o;return}c[k>>2]=c[k>>2]|2;c[b>>2]=x;Oi(e);Oi(n);i=o;return}function Qk(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b+8|0;m=b+4|0;l=b;c[m>>2]=c[d>>2];c[l>>2]=c[e>>2];c[k+0>>2]=c[m+0>>2];c[j+0>>2]=c[l+0>>2];Rk(a,0,k,j,f,g,h);i=b;return}function Rk(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;o=i;i=i+240|0;w=o+200|0;A=o+199|0;x=o+198|0;n=o+184|0;e=o+172|0;r=o+168|0;s=o+8|0;u=o+4|0;t=o;q=o+197|0;v=o+196|0;sl(n,j,w,A,x);c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;Ri(e,10,0);if((a[e]&1)==0){D=e+1|0;y=D;z=e+8|0}else{D=e+8|0;y=e+1|0;z=D;D=c[D>>2]|0}c[r>>2]=D;c[u>>2]=s;c[t>>2]=0;a[q]=1;a[v]=69;j=e+4|0;A=a[A]|0;B=a[x]|0;x=c[f>>2]|0;a:while(1){if((x|0)!=0){if((c[x+12>>2]|0)==(c[x+16>>2]|0)?(sc[c[(c[x>>2]|0)+36>>2]&127](x)|0)==-1:0){c[f>>2]=0;x=0}}else{x=0}E=(x|0)==0;C=c[g>>2]|0;do{if((C|0)!=0){if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){if(E){break}else{break a}}if(!((sc[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1)){if(E){break}else{break a}}else{c[g>>2]=0;m=14;break}}else{m=14}}while(0);if((m|0)==14){m=0;if(E){C=0;break}else{C=0}}E=a[e]|0;G=(E&1)==0;if(G){F=(E&255)>>>1}else{F=c[j>>2]|0}if(((c[r>>2]|0)-D|0)==(F|0)){if(G){D=(E&255)>>>1;E=(E&255)>>>1}else{E=c[j>>2]|0;D=E}Ri(e,D<<1,0);if((a[e]&1)==0){D=10}else{D=(c[e>>2]&-2)+ -1|0}Ri(e,D,0);if((a[e]&1)==0){D=y}else{D=c[z>>2]|0}c[r>>2]=D+E}F=x+12|0;G=c[F>>2]|0;E=x+16|0;if((G|0)==(c[E>>2]|0)){G=sc[c[(c[x>>2]|0)+36>>2]&127](x)|0}else{G=d[G]|0}if((tl(G&255,q,v,D,r,A,B,n,s,u,t,w)|0)!=0){break}C=c[F>>2]|0;if((C|0)==(c[E>>2]|0)){sc[c[(c[x>>2]|0)+40>>2]&127](x)|0;continue}else{c[F>>2]=C+1;continue}}v=a[n]|0;if((v&1)==0){v=(v&255)>>>1}else{v=c[n+4>>2]|0}if(((v|0)!=0?(a[q]|0)!=0:0)?(p=c[u>>2]|0,(p-s|0)<160):0){G=c[t>>2]|0;c[u>>2]=p+4;c[p>>2]=G}h[l>>3]=+fq(D,c[r>>2]|0,k);En(n,s,c[u>>2]|0,k);if((x|0)!=0){if((c[x+12>>2]|0)==(c[x+16>>2]|0)?(sc[c[(c[x>>2]|0)+36>>2]&127](x)|0)==-1:0){c[f>>2]=0;x=0}}else{x=0}p=(x|0)==0;do{if((C|0)!=0){if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){if(!p){break}c[b>>2]=x;Oi(e);Oi(n);i=o;return}if((sc[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1){c[g>>2]=0;m=51;break}if(p^(C|0)==0){c[b>>2]=x;Oi(e);Oi(n);i=o;return}}else{m=51}}while(0);if((m|0)==51?!p:0){c[b>>2]=x;Oi(e);Oi(n);i=o;return}c[k>>2]=c[k>>2]|2;c[b>>2]=x;Oi(e);Oi(n);i=o;return}function Sk(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;e=i;i=i+240|0;o=e;p=e+204|0;m=e+192|0;q=e+188|0;n=e+176|0;y=e+16|0;c[m+0>>2]=0;c[m+4>>2]=0;c[m+8>>2]=0;hj(q,h);h=c[q>>2]|0;if(!((c[6878]|0)==-1)){c[o>>2]=27512;c[o+4>>2]=122;c[o+8>>2]=0;Hi(27512,o,123)}s=(c[27516>>2]|0)+ -1|0;r=c[h+8>>2]|0;if(!((c[h+12>>2]|0)-r>>2>>>0>s>>>0)){F=wb(4)|0;Jq(F);ec(F|0,35472,111)}h=c[r+(s<<2)>>2]|0;if((h|0)==0){F=wb(4)|0;Jq(F);ec(F|0,35472,111)}yc[c[(c[h>>2]|0)+32>>2]&7](h,26056,26082|0,p)|0;li(c[q>>2]|0)|0;c[n+0>>2]=0;c[n+4>>2]=0;c[n+8>>2]=0;Ri(n,10,0);if((a[n]&1)==0){A=n+1|0;w=A;x=n+8|0}else{A=n+8|0;w=n+1|0;x=A;A=c[A>>2]|0}u=n+4|0;v=p+24|0;t=p+25|0;s=y;q=p+26|0;r=p;h=m+4|0;C=c[f>>2]|0;z=0;B=A;a:while(1){if((C|0)!=0){if((c[C+12>>2]|0)==(c[C+16>>2]|0)?(sc[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1:0){c[f>>2]=0;C=0}}else{C=0}E=(C|0)==0;D=c[g>>2]|0;do{if((D|0)!=0){if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(E){break}else{break a}}if(!((sc[c[(c[D>>2]|0)+36>>2]&127](D)|0)==-1)){if(E){break}else{break a}}else{c[g>>2]=0;l=19;break}}else{l=19}}while(0);if((l|0)==19?(l=0,E):0){break}D=a[n]|0;E=(D&1)==0;if(E){F=(D&255)>>>1}else{F=c[u>>2]|0}if((B-A|0)==(F|0)){if(E){A=(D&255)>>>1;B=(D&255)>>>1}else{B=c[u>>2]|0;A=B}Ri(n,A<<1,0);if((a[n]&1)==0){A=10}else{A=(c[n>>2]&-2)+ -1|0}Ri(n,A,0);if((a[n]&1)==0){A=w}else{A=c[x>>2]|0}B=A+B|0}D=c[C+12>>2]|0;if((D|0)==(c[C+16>>2]|0)){C=sc[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{C=d[D]|0}D=C&255;C=(B|0)==(A|0);do{if(C){E=(a[v]|0)==D<<24>>24;if(!E?!((a[t]|0)==D<<24>>24):0){l=40;break}a[B]=E?43:45;B=B+1|0;z=0}else{l=40}}while(0);do{if((l|0)==40){l=0;E=a[m]|0;if((E&1)==0){E=(E&255)>>>1}else{E=c[h>>2]|0}if((E|0)!=0&D<<24>>24==0){if((y-s|0)>=160){break}c[y>>2]=z;y=y+4|0;z=0;break}else{F=p}while(1){E=F+1|0;if((a[F]|0)==D<<24>>24){break}if((E|0)==(q|0)){F=q;break}else{F=E}}D=F-r|0;if((D|0)>23){break a}if((D|0)<22){a[B]=a[26056+D|0]|0;B=B+1|0;z=z+1|0;break}if(C){A=B;break a}if((B-A|0)>=3){break a}if((a[B+ -1|0]|0)!=48){break a}a[B]=a[26056+D|0]|0;B=B+1|0;z=0}}while(0);C=c[f>>2]|0;D=C+12|0;E=c[D>>2]|0;if((E|0)==(c[C+16>>2]|0)){sc[c[(c[C>>2]|0)+40>>2]&127](C)|0;continue}else{c[D>>2]=E+1;continue}}a[A+3|0]=0;if((a[27408]|0)==0?(Fa(27408)|0)!=0:0){c[6850]=fb(2147483647,27416,0)|0;cb(27408)}F=c[6850]|0;c[o>>2]=k;if((Uk(A,F,26096,o)|0)!=1){c[j>>2]=4}k=c[f>>2]|0;if((k|0)!=0){if((c[k+12>>2]|0)==(c[k+16>>2]|0)?(sc[c[(c[k>>2]|0)+36>>2]&127](k)|0)==-1:0){c[f>>2]=0;f=0}else{f=k}}else{f=0}k=(f|0)==0;o=c[g>>2]|0;do{if((o|0)!=0){if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){if(!k){break}c[b>>2]=f;Oi(n);Oi(m);i=e;return}if((sc[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1){c[g>>2]=0;l=72;break}if(k^(o|0)==0){c[b>>2]=f;Oi(n);Oi(m);i=e;return}}else{l=72}}while(0);if((l|0)==72?!k:0){c[b>>2]=f;Oi(n);Oi(m);i=e;return}c[j>>2]=c[j>>2]|2;c[b>>2]=f;Oi(n);Oi(m);i=e;return}function Tk(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0;n=i;o=c[f>>2]|0;p=(o|0)==(e|0);do{if(p){q=(a[m+24|0]|0)==b<<24>>24;if(!q?!((a[m+25|0]|0)==b<<24>>24):0){break}c[f>>2]=e+1;a[e]=q?43:45;c[g>>2]=0;q=0;i=n;return q|0}}while(0);q=a[j]|0;if((q&1)==0){j=(q&255)>>>1}else{j=c[j+4>>2]|0}if((j|0)!=0&b<<24>>24==h<<24>>24){o=c[l>>2]|0;if((o-k|0)>=160){q=0;i=n;return q|0}q=c[g>>2]|0;c[l>>2]=o+4;c[o>>2]=q;c[g>>2]=0;q=0;i=n;return q|0}l=m+26|0;k=m;while(1){h=k+1|0;if((a[k]|0)==b<<24>>24){break}if((h|0)==(l|0)){k=l;break}else{k=h}}m=k-m|0;if((m|0)>23){q=-1;i=n;return q|0}if((d|0)==16){if((m|0)>=22){if(p){q=-1;i=n;return q|0}if((o-e|0)>=3){q=-1;i=n;return q|0}if((a[o+ -1|0]|0)!=48){q=-1;i=n;return q|0}c[g>>2]=0;q=a[26056+m|0]|0;c[f>>2]=o+1;a[o]=q;q=0;i=n;return q|0}}else if((d|0)==10|(d|0)==8?(m|0)>=(d|0):0){q=-1;i=n;return q|0}q=a[26056+m|0]|0;c[f>>2]=o+1;a[o]=q;c[g>>2]=(c[g>>2]|0)+1;q=0;i=n;return q|0}function Uk(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+16|0;g=f;c[g>>2]=e;b=zb(b|0)|0;d=Da(a|0,d|0,g|0)|0;if((b|0)==0){i=f;return d|0}zb(b|0)|0;i=f;return d|0}function Vk(a){a=a|0;var b=0;b=i;jr(a);i=b;return}function Wk(a){a=a|0;return}function Xk(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;k=i;i=i+80|0;l=k;s=k+64|0;q=k+60|0;r=k+56|0;u=k+52|0;t=k+48|0;p=k+44|0;m=k+40|0;n=k+16|0;o=k+12|0;if((c[g+4>>2]&1|0)==0){c[q>>2]=-1;p=c[(c[d>>2]|0)+16>>2]|0;c[u>>2]=c[e>>2];c[t>>2]=c[f>>2];c[s+0>>2]=c[u+0>>2];c[l+0>>2]=c[t+0>>2];nc[p&63](r,d,s,l,g,h,q);l=c[r>>2]|0;c[e>>2]=l;e=c[q>>2]|0;if((e|0)==1){a[j]=1}else if((e|0)==0){a[j]=0}else{a[j]=1;c[h>>2]=4}c[b>>2]=l;i=k;return}hj(p,g);q=c[p>>2]|0;if(!((c[6876]|0)==-1)){c[l>>2]=27504;c[l+4>>2]=122;c[l+8>>2]=0;Hi(27504,l,123)}d=(c[27508>>2]|0)+ -1|0;r=c[q+8>>2]|0;if(!((c[q+12>>2]|0)-r>>2>>>0>d>>>0)){u=wb(4)|0;Jq(u);ec(u|0,35472,111)}q=c[r+(d<<2)>>2]|0;if((q|0)==0){u=wb(4)|0;Jq(u);ec(u|0,35472,111)}li(c[p>>2]|0)|0;hj(m,g);g=c[m>>2]|0;if(!((c[6916]|0)==-1)){c[l>>2]=27664;c[l+4>>2]=122;c[l+8>>2]=0;Hi(27664,l,123)}r=(c[27668>>2]|0)+ -1|0;p=c[g+8>>2]|0;if(!((c[g+12>>2]|0)-p>>2>>>0>r>>>0)){u=wb(4)|0;Jq(u);ec(u|0,35472,111)}g=c[p+(r<<2)>>2]|0;if((g|0)==0){u=wb(4)|0;Jq(u);ec(u|0,35472,111)}li(c[m>>2]|0)|0;qc[c[(c[g>>2]|0)+24>>2]&63](n,g);qc[c[(c[g>>2]|0)+28>>2]&63](n+12|0,g);c[o>>2]=c[f>>2];u=n+24|0;c[l+0>>2]=c[o+0>>2];a[j]=(Yk(e,l,n,u,q,h,1)|0)==(n|0)|0;c[b>>2]=c[e>>2];_i(n+12|0);_i(n);i=k;return}function Yk(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;k=i;i=i+112|0;o=k;s=(f-e|0)/12|0;if(s>>>0>100){o=cr(s)|0;if((o|0)==0){or()}else{m=o;n=o}}else{m=0;n=o}o=(e|0)==(f|0);if(o){t=0}else{p=e;t=0;q=n;while(1){r=a[p]|0;if((r&1)==0){r=(r&255)>>>1}else{r=c[p+4>>2]|0}if((r|0)==0){a[q]=2;t=t+1|0;s=s+ -1|0}else{a[q]=1}p=p+12|0;if((p|0)==(f|0)){break}else{q=q+1|0}}}p=0;a:while(1){r=c[b>>2]|0;do{if((r|0)!=0){q=c[r+12>>2]|0;if((q|0)==(c[r+16>>2]|0)){q=sc[c[(c[r>>2]|0)+36>>2]&127](r)|0}else{q=c[q>>2]|0}if((q|0)==-1){c[b>>2]=0;r=1;break}else{r=(c[b>>2]|0)==0;break}}else{r=1}}while(0);q=c[d>>2]|0;if((q|0)!=0){u=c[q+12>>2]|0;if((u|0)==(c[q+16>>2]|0)){u=sc[c[(c[q>>2]|0)+36>>2]&127](q)|0}else{u=c[u>>2]|0}if((u|0)==-1){c[d>>2]=0;q=0;v=1}else{v=0}}else{q=0;v=1}u=c[b>>2]|0;if(!((r^v)&(s|0)!=0)){break}q=c[u+12>>2]|0;if((q|0)==(c[u+16>>2]|0)){r=sc[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{r=c[q>>2]|0}if(!j){r=Bc[c[(c[g>>2]|0)+28>>2]&31](g,r)|0}q=p+1|0;if(o){p=q;continue}b:do{if(j){w=0;u=e;v=n;while(1){do{if((a[v]|0)==1){z=a[u]|0;y=(z&1)==0;if(y){x=u+4|0}else{x=c[u+8>>2]|0}if((r|0)!=(c[x+(p<<2)>>2]|0)){a[v]=0;s=s+ -1|0;break}if(y){w=(z&255)>>>1}else{w=c[u+4>>2]|0}if((w|0)==(q|0)){a[v]=2;w=1;t=t+1|0;s=s+ -1|0}else{w=1}}}while(0);u=u+12|0;if((u|0)==(f|0)){break b}v=v+1|0}}else{w=0;u=e;v=n;while(1){do{if((a[v]|0)==1){if((a[u]&1)==0){x=u+4|0}else{x=c[u+8>>2]|0}if((r|0)!=(Bc[c[(c[g>>2]|0)+28>>2]&31](g,c[x+(p<<2)>>2]|0)|0)){a[v]=0;s=s+ -1|0;break}w=a[u]|0;if((w&1)==0){w=(w&255)>>>1}else{w=c[u+4>>2]|0}if((w|0)==(q|0)){a[v]=2;w=1;t=t+1|0;s=s+ -1|0}else{w=1}}}while(0);u=u+12|0;if((u|0)==(f|0)){break b}v=v+1|0}}}while(0);if(!w){p=q;continue}p=c[b>>2]|0;r=p+12|0;u=c[r>>2]|0;if((u|0)==(c[p+16>>2]|0)){sc[c[(c[p>>2]|0)+40>>2]&127](p)|0}else{c[r>>2]=u+4}if((s+t|0)>>>0<2){p=q;continue}else{r=e;p=n}while(1){if((a[p]|0)==2){u=a[r]|0;if((u&1)==0){u=(u&255)>>>1}else{u=c[r+4>>2]|0}if((u|0)!=(q|0)){a[p]=0;t=t+ -1|0}}r=r+12|0;if((r|0)==(f|0)){p=q;continue a}else{p=p+1|0}}}do{if((u|0)!=0){g=c[u+12>>2]|0;if((g|0)==(c[u+16>>2]|0)){g=sc[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{g=c[g>>2]|0}if((g|0)==-1){c[b>>2]=0;b=1;break}else{b=(c[b>>2]|0)==0;break}}else{b=1}}while(0);do{if((q|0)!=0){g=c[q+12>>2]|0;if((g|0)==(c[q+16>>2]|0)){g=sc[c[(c[q>>2]|0)+36>>2]&127](q)|0}else{g=c[g>>2]|0}if(!((g|0)==-1)){if(b){break}else{l=87;break}}else{c[d>>2]=0;l=85;break}}else{l=85}}while(0);if((l|0)==85?b:0){l=87}if((l|0)==87){c[h>>2]=c[h>>2]|2}c:do{if(!o){if((a[n]|0)==2){f=e}else{while(1){e=e+12|0;n=n+1|0;if((e|0)==(f|0)){l=92;break c}if((a[n]|0)==2){f=e;break}}}}else{l=92}}while(0);if((l|0)==92){c[h>>2]=c[h>>2]|4}if((m|0)==0){i=k;return f|0}dr(m);i=k;return f|0}function Zk(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b+8|0;m=b+4|0;l=b;c[m>>2]=c[d>>2];c[l>>2]=c[e>>2];c[k+0>>2]=c[m+0>>2];c[j+0>>2]=c[l+0>>2];_k(a,0,k,j,f,g,h);i=b;return}function _k(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;m=i;i=i+304|0;t=m+200|0;u=m+196|0;d=m+184|0;l=m+172|0;p=m+168|0;q=m+8|0;o=m+4|0;r=m;s=c[g+4>>2]&74;if((s|0)==8){s=16}else if((s|0)==64){s=8}else if((s|0)==0){s=0}else{s=10}ul(d,g,t,u);c[l+0>>2]=0;c[l+4>>2]=0;c[l+8>>2]=0;Ri(l,10,0);if((a[l]&1)==0){z=l+1|0;w=z;v=l+8|0}else{z=l+8|0;w=l+1|0;v=z;z=c[z>>2]|0}c[p>>2]=z;c[o>>2]=q;c[r>>2]=0;g=l+4|0;x=c[u>>2]|0;u=c[e>>2]|0;a:while(1){if((u|0)!=0){y=c[u+12>>2]|0;if((y|0)==(c[u+16>>2]|0)){y=sc[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{y=c[y>>2]|0}if((y|0)==-1){c[e>>2]=0;A=1;u=0}else{A=0}}else{A=1;u=0}y=c[f>>2]|0;do{if((y|0)!=0){B=c[y+12>>2]|0;if((B|0)==(c[y+16>>2]|0)){B=sc[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{B=c[B>>2]|0}if(!((B|0)==-1)){if(A){break}else{break a}}else{c[f>>2]=0;k=21;break}}else{k=21}}while(0);if((k|0)==21){k=0;if(A){y=0;break}else{y=0}}A=a[l]|0;B=(A&1)==0;if(B){C=(A&255)>>>1}else{C=c[g>>2]|0}if(((c[p>>2]|0)-z|0)==(C|0)){if(B){z=(A&255)>>>1;A=(A&255)>>>1}else{A=c[g>>2]|0;z=A}Ri(l,z<<1,0);if((a[l]&1)==0){z=10}else{z=(c[l>>2]&-2)+ -1|0}Ri(l,z,0);if((a[l]&1)==0){z=w}else{z=c[v>>2]|0}c[p>>2]=z+A}B=u+12|0;C=c[B>>2]|0;A=u+16|0;if((C|0)==(c[A>>2]|0)){C=sc[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{C=c[C>>2]|0}if((ql(C,s,z,p,r,x,d,q,o,t)|0)!=0){break}y=c[B>>2]|0;if((y|0)==(c[A>>2]|0)){sc[c[(c[u>>2]|0)+40>>2]&127](u)|0;continue}else{c[B>>2]=y+4;continue}}t=a[d]|0;if((t&1)==0){t=(t&255)>>>1}else{t=c[d+4>>2]|0}if((t|0)!=0?(n=c[o>>2]|0,(n-q|0)<160):0){C=c[r>>2]|0;c[o>>2]=n+4;c[n>>2]=C}c[j>>2]=nq(z,c[p>>2]|0,h,s)|0;En(d,q,c[o>>2]|0,h);if((u|0)!=0){j=c[u+12>>2]|0;if((j|0)==(c[u+16>>2]|0)){j=sc[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{j=c[j>>2]|0}if((j|0)==-1){c[e>>2]=0;u=0;e=1}else{e=0}}else{u=0;e=1}do{if((y|0)!=0){j=c[y+12>>2]|0;if((j|0)==(c[y+16>>2]|0)){j=sc[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{j=c[j>>2]|0}if((j|0)==-1){c[f>>2]=0;k=60;break}if(e){c[b>>2]=u;Oi(l);Oi(d);i=m;return}}else{k=60}}while(0);if((k|0)==60?!e:0){c[b>>2]=u;Oi(l);Oi(d);i=m;return}c[h>>2]=c[h>>2]|2;c[b>>2]=u;Oi(l);Oi(d);i=m;return}function $k(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b+8|0;m=b+4|0;l=b;c[m>>2]=c[d>>2];c[l>>2]=c[e>>2];c[k+0>>2]=c[m+0>>2];c[j+0>>2]=c[l+0>>2];al(a,0,k,j,f,g,h);i=b;return}function al(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;m=i;i=i+304|0;t=m+200|0;u=m+196|0;d=m+184|0;l=m+172|0;p=m+168|0;q=m+8|0;o=m+4|0;r=m;s=c[g+4>>2]&74;if((s|0)==64){s=8}else if((s|0)==0){s=0}else if((s|0)==8){s=16}else{s=10}ul(d,g,t,u);c[l+0>>2]=0;c[l+4>>2]=0;c[l+8>>2]=0;Ri(l,10,0);if((a[l]&1)==0){z=l+1|0;w=z;v=l+8|0}else{z=l+8|0;w=l+1|0;v=z;z=c[z>>2]|0}c[p>>2]=z;c[o>>2]=q;c[r>>2]=0;g=l+4|0;x=c[u>>2]|0;u=c[e>>2]|0;a:while(1){if((u|0)!=0){y=c[u+12>>2]|0;if((y|0)==(c[u+16>>2]|0)){y=sc[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{y=c[y>>2]|0}if((y|0)==-1){c[e>>2]=0;A=1;u=0}else{A=0}}else{A=1;u=0}y=c[f>>2]|0;do{if((y|0)!=0){B=c[y+12>>2]|0;if((B|0)==(c[y+16>>2]|0)){B=sc[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{B=c[B>>2]|0}if(!((B|0)==-1)){if(A){break}else{break a}}else{c[f>>2]=0;k=21;break}}else{k=21}}while(0);if((k|0)==21){k=0;if(A){y=0;break}else{y=0}}A=a[l]|0;B=(A&1)==0;if(B){C=(A&255)>>>1}else{C=c[g>>2]|0}if(((c[p>>2]|0)-z|0)==(C|0)){if(B){z=(A&255)>>>1;A=(A&255)>>>1}else{A=c[g>>2]|0;z=A}Ri(l,z<<1,0);if((a[l]&1)==0){z=10}else{z=(c[l>>2]&-2)+ -1|0}Ri(l,z,0);if((a[l]&1)==0){z=w}else{z=c[v>>2]|0}c[p>>2]=z+A}B=u+12|0;C=c[B>>2]|0;A=u+16|0;if((C|0)==(c[A>>2]|0)){C=sc[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{C=c[C>>2]|0}if((ql(C,s,z,p,r,x,d,q,o,t)|0)!=0){break}y=c[B>>2]|0;if((y|0)==(c[A>>2]|0)){sc[c[(c[u>>2]|0)+40>>2]&127](u)|0;continue}else{c[B>>2]=y+4;continue}}t=a[d]|0;if((t&1)==0){t=(t&255)>>>1}else{t=c[d+4>>2]|0}if((t|0)!=0?(n=c[o>>2]|0,(n-q|0)<160):0){C=c[r>>2]|0;c[o>>2]=n+4;c[n>>2]=C}B=mq(z,c[p>>2]|0,h,s)|0;C=j;c[C>>2]=B;c[C+4>>2]=I;En(d,q,c[o>>2]|0,h);if((u|0)!=0){j=c[u+12>>2]|0;if((j|0)==(c[u+16>>2]|0)){j=sc[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{j=c[j>>2]|0}if((j|0)==-1){c[e>>2]=0;u=0;e=1}else{e=0}}else{u=0;e=1}do{if((y|0)!=0){j=c[y+12>>2]|0;if((j|0)==(c[y+16>>2]|0)){j=sc[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{j=c[j>>2]|0}if((j|0)==-1){c[f>>2]=0;k=60;break}if(e){c[b>>2]=u;Oi(l);Oi(d);i=m;return}}else{k=60}}while(0);if((k|0)==60?!e:0){c[b>>2]=u;Oi(l);Oi(d);i=m;return}c[h>>2]=c[h>>2]|2;c[b>>2]=u;Oi(l);Oi(d);i=m;return}function bl(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b+8|0;m=b+4|0;l=b;c[m>>2]=c[d>>2];c[l>>2]=c[e>>2];c[k+0>>2]=c[m+0>>2];c[j+0>>2]=c[l+0>>2];cl(a,0,k,j,f,g,h);i=b;return}function cl(d,e,f,g,h,j,k){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;n=i;i=i+304|0;u=n+200|0;v=n+196|0;e=n+184|0;m=n+172|0;q=n+168|0;r=n+8|0;p=n+4|0;s=n;t=c[h+4>>2]&74;if((t|0)==64){t=8}else if((t|0)==8){t=16}else if((t|0)==0){t=0}else{t=10}ul(e,h,u,v);c[m+0>>2]=0;c[m+4>>2]=0;c[m+8>>2]=0;Ri(m,10,0);if((a[m]&1)==0){A=m+1|0;x=A;w=m+8|0}else{A=m+8|0;x=m+1|0;w=A;A=c[A>>2]|0}c[q>>2]=A;c[p>>2]=r;c[s>>2]=0;h=m+4|0;y=c[v>>2]|0;v=c[f>>2]|0;a:while(1){if((v|0)!=0){z=c[v+12>>2]|0;if((z|0)==(c[v+16>>2]|0)){z=sc[c[(c[v>>2]|0)+36>>2]&127](v)|0}else{z=c[z>>2]|0}if((z|0)==-1){c[f>>2]=0;B=1;v=0}else{B=0}}else{B=1;v=0}z=c[g>>2]|0;do{if((z|0)!=0){C=c[z+12>>2]|0;if((C|0)==(c[z+16>>2]|0)){C=sc[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{C=c[C>>2]|0}if(!((C|0)==-1)){if(B){break}else{break a}}else{c[g>>2]=0;l=21;break}}else{l=21}}while(0);if((l|0)==21){l=0;if(B){z=0;break}else{z=0}}B=a[m]|0;C=(B&1)==0;if(C){D=(B&255)>>>1}else{D=c[h>>2]|0}if(((c[q>>2]|0)-A|0)==(D|0)){if(C){A=(B&255)>>>1;B=(B&255)>>>1}else{B=c[h>>2]|0;A=B}Ri(m,A<<1,0);if((a[m]&1)==0){A=10}else{A=(c[m>>2]&-2)+ -1|0}Ri(m,A,0);if((a[m]&1)==0){A=x}else{A=c[w>>2]|0}c[q>>2]=A+B}C=v+12|0;D=c[C>>2]|0;B=v+16|0;if((D|0)==(c[B>>2]|0)){D=sc[c[(c[v>>2]|0)+36>>2]&127](v)|0}else{D=c[D>>2]|0}if((ql(D,t,A,q,s,y,e,r,p,u)|0)!=0){break}z=c[C>>2]|0;if((z|0)==(c[B>>2]|0)){sc[c[(c[v>>2]|0)+40>>2]&127](v)|0;continue}else{c[C>>2]=z+4;continue}}u=a[e]|0;if((u&1)==0){u=(u&255)>>>1}else{u=c[e+4>>2]|0}if((u|0)!=0?(o=c[p>>2]|0,(o-r|0)<160):0){D=c[s>>2]|0;c[p>>2]=o+4;c[o>>2]=D}b[k>>1]=lq(A,c[q>>2]|0,j,t)|0;En(e,r,c[p>>2]|0,j);if((v|0)!=0){k=c[v+12>>2]|0;if((k|0)==(c[v+16>>2]|0)){k=sc[c[(c[v>>2]|0)+36>>2]&127](v)|0}else{k=c[k>>2]|0}if((k|0)==-1){c[f>>2]=0;v=0;f=1}else{f=0}}else{v=0;f=1}do{if((z|0)!=0){k=c[z+12>>2]|0;if((k|0)==(c[z+16>>2]|0)){k=sc[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{k=c[k>>2]|0}if((k|0)==-1){c[g>>2]=0;l=60;break}if(f){c[d>>2]=v;Oi(m);Oi(e);i=n;return}}else{l=60}}while(0);if((l|0)==60?!f:0){c[d>>2]=v;Oi(m);Oi(e);i=n;return}c[j>>2]=c[j>>2]|2;c[d>>2]=v;Oi(m);Oi(e);i=n;return}function dl(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b+8|0;m=b+4|0;l=b;c[m>>2]=c[d>>2];c[l>>2]=c[e>>2];c[k+0>>2]=c[m+0>>2];c[j+0>>2]=c[l+0>>2];el(a,0,k,j,f,g,h);i=b;return}function el(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;m=i;i=i+304|0;t=m+200|0;u=m+196|0;d=m+184|0;l=m+172|0;p=m+168|0;q=m+8|0;o=m+4|0;r=m;s=c[g+4>>2]&74;if((s|0)==8){s=16}else if((s|0)==0){s=0}else if((s|0)==64){s=8}else{s=10}ul(d,g,t,u);c[l+0>>2]=0;c[l+4>>2]=0;c[l+8>>2]=0;Ri(l,10,0);if((a[l]&1)==0){z=l+1|0;w=z;v=l+8|0}else{z=l+8|0;w=l+1|0;v=z;z=c[z>>2]|0}c[p>>2]=z;c[o>>2]=q;c[r>>2]=0;g=l+4|0;x=c[u>>2]|0;u=c[e>>2]|0;a:while(1){if((u|0)!=0){y=c[u+12>>2]|0;if((y|0)==(c[u+16>>2]|0)){y=sc[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{y=c[y>>2]|0}if((y|0)==-1){c[e>>2]=0;A=1;u=0}else{A=0}}else{A=1;u=0}y=c[f>>2]|0;do{if((y|0)!=0){B=c[y+12>>2]|0;if((B|0)==(c[y+16>>2]|0)){B=sc[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{B=c[B>>2]|0}if(!((B|0)==-1)){if(A){break}else{break a}}else{c[f>>2]=0;k=21;break}}else{k=21}}while(0);if((k|0)==21){k=0;if(A){y=0;break}else{y=0}}A=a[l]|0;B=(A&1)==0;if(B){C=(A&255)>>>1}else{C=c[g>>2]|0}if(((c[p>>2]|0)-z|0)==(C|0)){if(B){z=(A&255)>>>1;A=(A&255)>>>1}else{A=c[g>>2]|0;z=A}Ri(l,z<<1,0);if((a[l]&1)==0){z=10}else{z=(c[l>>2]&-2)+ -1|0}Ri(l,z,0);if((a[l]&1)==0){z=w}else{z=c[v>>2]|0}c[p>>2]=z+A}B=u+12|0;C=c[B>>2]|0;A=u+16|0;if((C|0)==(c[A>>2]|0)){C=sc[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{C=c[C>>2]|0}if((ql(C,s,z,p,r,x,d,q,o,t)|0)!=0){break}y=c[B>>2]|0;if((y|0)==(c[A>>2]|0)){sc[c[(c[u>>2]|0)+40>>2]&127](u)|0;continue}else{c[B>>2]=y+4;continue}}t=a[d]|0;if((t&1)==0){t=(t&255)>>>1}else{t=c[d+4>>2]|0}if((t|0)!=0?(n=c[o>>2]|0,(n-q|0)<160):0){C=c[r>>2]|0;c[o>>2]=n+4;c[n>>2]=C}c[j>>2]=kq(z,c[p>>2]|0,h,s)|0;En(d,q,c[o>>2]|0,h);if((u|0)!=0){j=c[u+12>>2]|0;if((j|0)==(c[u+16>>2]|0)){j=sc[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{j=c[j>>2]|0}if((j|0)==-1){c[e>>2]=0;u=0;e=1}else{e=0}}else{u=0;e=1}do{if((y|0)!=0){j=c[y+12>>2]|0;if((j|0)==(c[y+16>>2]|0)){j=sc[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{j=c[j>>2]|0}if((j|0)==-1){c[f>>2]=0;k=60;break}if(e){c[b>>2]=u;Oi(l);Oi(d);i=m;return}}else{k=60}}while(0);if((k|0)==60?!e:0){c[b>>2]=u;Oi(l);Oi(d);i=m;return}c[h>>2]=c[h>>2]|2;c[b>>2]=u;Oi(l);Oi(d);i=m;return}






function Tr(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=a;j=b;i=j;k=d;g=e;l=g;if((i|0)==0){d=(f|0)!=0;if((l|0)==0){if(d){c[f>>2]=(h>>>0)%(k>>>0);c[f+4>>2]=0}l=0;m=(h>>>0)/(k>>>0)>>>0;return(I=l,m)|0}else{if(!d){l=0;m=0;return(I=l,m)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;l=0;m=0;return(I=l,m)|0}}m=(l|0)==0;do{if((k|0)!=0){if(!m){k=(Lr(l|0)|0)-(Lr(i|0)|0)|0;if(k>>>0<=31){l=k+1|0;m=31-k|0;b=k-31>>31;j=l;a=h>>>(l>>>0)&b|i<<m;b=i>>>(l>>>0)&b;l=0;i=h<<m;break}if((f|0)==0){l=0;m=0;return(I=l,m)|0}c[f>>2]=a|0;c[f+4>>2]=j|b&0;l=0;m=0;return(I=l,m)|0}l=k-1|0;if((l&k|0)!=0){m=(Lr(k|0)|0)+33-(Lr(i|0)|0)|0;p=64-m|0;k=32-m|0;n=k>>31;o=m-32|0;b=o>>31;j=m;a=k-1>>31&i>>>(o>>>0)|(i<<k|h>>>(m>>>0))&b;b=b&i>>>(m>>>0);l=h<<p&n;i=(i<<p|h>>>(o>>>0))&n|h<<k&m-33>>31;break}if((f|0)!=0){c[f>>2]=l&h;c[f+4>>2]=0}if((k|0)==1){o=j|b&0;p=a|0|0;return(I=o,p)|0}else{p=Mr(k|0)|0;o=i>>>(p>>>0)|0;p=i<<32-p|h>>>(p>>>0)|0;return(I=o,p)|0}}else{if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(k>>>0);c[f+4>>2]=0}o=0;p=(i>>>0)/(k>>>0)>>>0;return(I=o,p)|0}if((h|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}o=0;p=(i>>>0)/(l>>>0)>>>0;return(I=o,p)|0}k=l-1|0;if((k&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=k&i|b&0}o=0;p=i>>>((Mr(l|0)|0)>>>0);return(I=o,p)|0}k=(Lr(l|0)|0)-(Lr(i|0)|0)|0;if(k>>>0<=30){b=k+1|0;p=31-k|0;j=b;a=i<<p|h>>>(b>>>0);b=i>>>(b>>>0);l=0;i=h<<p;break}if((f|0)==0){o=0;p=0;return(I=o,p)|0}c[f>>2]=a|0;c[f+4>>2]=j|b&0;o=0;p=0;return(I=o,p)|0}}while(0);if((j|0)==0){m=a;d=0;a=0}else{d=d|0|0;g=g|e&0;e=Br(d,g,-1,-1)|0;h=I;k=b;m=a;a=0;while(1){b=l>>>31|i<<1;l=a|l<<1;i=m<<1|i>>>31|0;k=m>>>31|k<<1|0;Ar(e,h,i,k)|0;m=I;p=m>>31|((m|0)<0?-1:0)<<1;a=p&1;m=Ar(i,k,p&d,(((m|0)<0?-1:0)>>31|((m|0)<0?-1:0)<<1)&g)|0;k=I;j=j-1|0;if((j|0)==0){break}else{i=b}}i=b;b=k;d=0}g=0;if((f|0)!=0){c[f>>2]=m;c[f+4>>2]=b}o=(l|0)>>>31|(i|g)<<1|(g<<1|l>>>31)&0|d;p=(l<<1|0>>>31)&-2|a;return(I=o,p)|0}function Ur(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return mc[a&31](b|0,c|0,d|0)|0}function Vr(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;nc[a&63](b|0,c|0,d|0,e|0,f|0,g|0,h|0)}function Wr(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;oc[a&3](b|0,c|0,d|0,e|0,f|0)}function Xr(a,b){a=a|0;b=b|0;pc[a&255](b|0)}function Yr(a,b,c){a=a|0;b=b|0;c=c|0;qc[a&63](b|0,c|0)}function Zr(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;rc[a&3](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0)}function _r(a,b){a=a|0;b=b|0;return sc[a&127](b|0)|0}function $r(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;tc[a&3](b|0,c|0,d|0,e|0,f|0,g|0,+h)}function as(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;uc[a&7](b|0,c|0,d|0)}function bs(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;vc[a&7](b|0,c|0,d|0,e|0,f|0,+g)}function cs(a){a=a|0;wc[a&0]()}function ds(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;return xc[a&15](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)|0}function es(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return yc[a&7](b|0,c|0,d|0,e|0)|0}function fs(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;zc[a&7](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)}function gs(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;Ac[a&31](b|0,c|0,d|0,e|0,f|0,g|0)}function hs(a,b,c){a=a|0;b=b|0;c=c|0;return Bc[a&31](b|0,c|0)|0}function is(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return Cc[a&15](b|0,c|0,d|0,e|0,f|0)|0}function js(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;Dc[a&15](b|0,c|0,d|0,e|0)}function ks(a,b,c){a=a|0;b=b|0;c=c|0;fa(0);return 0}function ls(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;fa(1)}function ms(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;fa(2)}function ns(a){a=a|0;fa(3)}function os(a,b){a=a|0;b=b|0;fa(4)}function ps(a,b){a=a|0;b=b|0;hc(a|0,b|0)}function qs(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;fa(5)}function rs(a){a=a|0;fa(6);return 0}function ss(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;fa(7)}function ts(a,b,c){a=a|0;b=b|0;c=c|0;fa(8)}function us(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;fa(9)}function vs(){fa(10)}function ws(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;fa(11);return 0}function xs(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;fa(12);return 0}function ys(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;fa(13)}function zs(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;fa(14)}function As(a,b){a=a|0;b=b|0;fa(15);return 0}function Bs(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;fa(16);return 0}function Cs(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;fa(17)}




// EMSCRIPTEN_END_FUNCS
var mc=[ks,Zc,_c,$c,Ld,mj,rj,vj,Aj,Fj,Mh,Jj,_h,Ai,Bi,qk,vk,_n,eo,Mo,Oo,Ro,xo,Co,Eo,Ho,Tq,ks,ks,ks,ks,ks];var nc=[ls,yk,Ak,Ck,Ek,Gk,Ik,Kk,Mk,Ok,Qk,Sk,Xk,Zk,$k,bl,dl,fl,hl,jl,ll,nl,pl,El,Gl,Sl,Ul,bm,cm,dm,em,fm,om,pm,qm,rm,sm,Rn,Xn,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls,ls];var oc=[ms,_q,Zq,Yq];var pc=[ns,cd,dd,Rg,bh,ch,dh,Mj,Lj,Oj,Nj,eh,fh,Ih,Jh,Ph,Qh,Wh,Xh,bi,ci,oi,ni,ti,si,vi,wi,xi,Gi,Fi,kj,jj,yj,xj,Sj,Rj,Uj,Tj,Xj,Wj,Zj,Yj,ak,$j,ck,bk,ik,hk,gj,jk,gk,kk,mk,lk,uo,sk,rk,xk,wk,Wk,Vk,yl,xl,Nl,Ml,$l,_l,mm,lm,ym,xm,Bm,Am,Fm,Em,Qm,Pm,$m,_m,ln,kn,wn,vn,Gn,Fn,Nn,Mn,Tn,Sn,Zn,Yn,co,bo,no,mo,Ko,Jo,ho,$o,Gp,Fp,Ip,Hp,nk,to,wo,To,hp,sp,Dp,Ep,Lq,Kq,Nq,Qq,Oq,Pq,Rq,Sq,mr,lr,Hh,vo,oq,yn,dr,vq,uq,tq,sq,rq,qq,Oi,_i,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns,ns];var qc=[os,Md,lj,Kh,Rh,Yh,di,zj,Im,Jm,Km,Lm,Nm,Om,Tm,Um,Vm,Wm,Ym,Zm,cn,dn,en,fn,hn,jn,on,pn,qn,rn,tn,un,ao,go,Np,Pp,Rp,Op,Qp,Sp,ps,os,os,os,os,os,os,os,os,os,os,os,os,os,os,os,os,os,os,os,os,os,os,os];var rc=[qs,gm,tm,qs];var sc=[rs,Kd,pj,qj,ih,tj,Lh,Ej,Gj,Hj,Dj,Sh,Th,Zh,sj,ei,fi,pi,ui,ek,am,Tp,Vp,Xp,bq,dq,Zp,$p,nm,Up,Wp,Yp,cq,eq,_p,aq,Gm,Hm,Mm,Rm,Sm,Xm,an,bn,gn,mn,nn,sn,dp,ep,gp,Jp,Lp,Kp,Mp,Xo,Yo,_o,np,op,rp,yp,zp,Cp,Mq,nr,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs,rs];var tc=[ss,On,Un,ss];var uc=[ts,zi,fk,hd,id,ts,ts,ts];var vc=[us,Hl,Kl,Vl,Xl,us,us,us];var wc=[vs];var xc=[ws,ap,bp,Uo,Vo,ip,kp,tp,vp,ws,ws,ws,ws,ws,ws,ws];var yc=[xs,Wc,Xc,Qo,yo,zo,Ao,Go];var zc=[ys,zm,Cm,xn,Bn,Hn,Jn,ys];var Ac=[zs,gh,Bj,nj,zl,Al,Fl,Ll,Ol,Pl,Tl,Yl,$n,fo,br,ar,$q,zs,zs,zs,zs,zs,zs,zs,zs,zs,zs,zs,zs,zs,zs,zs];var Bc=[As,Yc,ed,jh,kh,Ij,Nh,Uh,Kj,uj,$h,gi,wj,Lo,No,Po,Bo,Do,Fo,As,As,As,As,As,As,As,As,As,As,As,As,As];var Cc=[Bs,ok,tk,So,cp,fp,Io,Wo,Zo,mp,pp,xp,Ap,Bs,Bs,Bs];var Dc=[Cs,hh,Cj,oj,pk,uk,Uq,Vq,Wq,Cs,Cs,Cs,Cs,Cs,Cs,Cs];return{_malloc:cr,_saveSetjmp:Dr,_restore:Cd,_free:dr,_delete_transformer:Ad,_realloc:er,_i64Add:Br,_memmove:Gr,_transform:Bd,_i64Subtract:Ar,_memset:Hr,_set_init_vector:Ed,_set_key:Dd,_memcpy:Fr,_strlen:Cr,_bitshift64Shl:Ir,_create_transformer:bd,_configure:Fd,_testSetjmp:Er,__GLOBAL__I_a:ii,runPostSets:zr,stackAlloc:Ec,stackSave:Fc,stackRestore:Gc,setThrew:Hc,setTempRet0:Kc,setTempRet1:Lc,setTempRet2:Mc,setTempRet3:Nc,setTempRet4:Oc,setTempRet5:Pc,setTempRet6:Qc,setTempRet7:Rc,setTempRet8:Sc,setTempRet9:Tc,dynCall_iiii:Ur,dynCall_viiiiiii:Vr,dynCall_viiiii:Wr,dynCall_vi:Xr,dynCall_vii:Yr,dynCall_viiiiiiiii:Zr,dynCall_ii:_r,dynCall_viiiiiid:$r,dynCall_viii:as,dynCall_viiiiid:bs,dynCall_v:cs,dynCall_iiiiiiiii:ds,dynCall_iiiii:es,dynCall_viiiiiiii:fs,dynCall_viiiiii:gs,dynCall_iii:hs,dynCall_iiiiii:is,dynCall_viiii:js}})


// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_iiii": invoke_iiii, "invoke_viiiiiii": invoke_viiiiiii, "invoke_viiiii": invoke_viiiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_viiiiiiiii": invoke_viiiiiiiii, "invoke_ii": invoke_ii, "invoke_viiiiiid": invoke_viiiiiid, "invoke_viii": invoke_viii, "invoke_viiiiid": invoke_viiiiid, "invoke_v": invoke_v, "invoke_iiiiiiiii": invoke_iiiiiiiii, "invoke_iiiii": invoke_iiiii, "invoke_viiiiiiii": invoke_viiiiiiii, "invoke_viiiiii": invoke_viiiiii, "invoke_iii": invoke_iii, "invoke_iiiiii": invoke_iiiiii, "invoke_viiii": invoke_viiii, "_fabs": _fabs, "_vsscanf": _vsscanf, "__ZSt9terminatev": __ZSt9terminatev, "___cxa_guard_acquire": ___cxa_guard_acquire, "__reallyNegative": __reallyNegative, "___assert_fail": ___assert_fail, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "_longjmp": _longjmp, "___ctype_toupper_loc": ___ctype_toupper_loc, "__addDays": __addDays, "_sbrk": _sbrk, "___cxa_begin_catch": ___cxa_begin_catch, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_sysconf": _sysconf, "_fileno": _fileno, "_fread": _fread, "_write": _write, "__isLeapYear": __isLeapYear, "__ZNSt9exceptionD2Ev": __ZNSt9exceptionD2Ev, "___cxa_does_inherit": ___cxa_does_inherit, "__exit": __exit, "___cxa_rethrow": ___cxa_rethrow, "_catclose": _catclose, "_send": _send, "___cxa_is_number_type": ___cxa_is_number_type, "___cxa_free_exception": ___cxa_free_exception, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "_isxdigit_l": _isxdigit_l, "___cxa_guard_release": ___cxa_guard_release, "_strtol": _strtol, "___setErrNo": ___setErrNo, "_newlocale": _newlocale, "_isdigit_l": _isdigit_l, "___resumeException": ___resumeException, "_freelocale": _freelocale, "_putchar": _putchar, "_sprintf": _sprintf, "_vasprintf": _vasprintf, "_vsnprintf": _vsnprintf, "_strtoull_l": _strtoull_l, "_read": _read, "_fwrite": _fwrite, "_time": _time, "_fprintf": _fprintf, "_catopen": _catopen, "_exit": _exit, "___ctype_b_loc": ___ctype_b_loc, "_fmod": _fmod, "___cxa_allocate_exception": ___cxa_allocate_exception, "_strtoll": _strtoll, "_pwrite": _pwrite, "_uselocale": _uselocale, "_snprintf": _snprintf, "__scanString": __scanString, "___cxa_end_catch": ___cxa_end_catch, "_strtoull": _strtoull, "_strftime": _strftime, "_isxdigit": _isxdigit, "__parseInt": __parseInt, "_pthread_cond_broadcast": _pthread_cond_broadcast, "_recv": _recv, "_fgetc": _fgetc, "__parseInt64": __parseInt64, "__getFloat": __getFloat, "_abort": _abort, "_ceil": _ceil, "_isspace": _isspace, "_pthread_cond_wait": _pthread_cond_wait, "_ungetc": _ungetc, "_fflush": _fflush, "_strftime_l": _strftime_l, "_pthread_mutex_lock": _pthread_mutex_lock, "_sscanf": _sscanf, "_catgets": _catgets, "_asprintf": _asprintf, "_strtoll_l": _strtoll_l, "__arraySum": __arraySum, "___ctype_tolower_loc": ___ctype_tolower_loc, "_pthread_mutex_unlock": _pthread_mutex_unlock, "_pread": _pread, "_mkport": _mkport, "___errno_location": ___errno_location, "_copysign": _copysign, "_fputc": _fputc, "___cxa_throw": ___cxa_throw, "_isdigit": _isdigit, "_strerror": _strerror, "_emscripten_longjmp": _emscripten_longjmp, "__formatString": __formatString, "_atexit": _atexit, "_strerror_r": _strerror_r, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "__ZTISt9exception": __ZTISt9exception, "___dso_handle": ___dso_handle, "_stderr": _stderr, "_stdin": _stdin, "_stdout": _stdout }, buffer);
var _malloc = Module["_malloc"] = asm["_malloc"];
var _saveSetjmp = Module["_saveSetjmp"] = asm["_saveSetjmp"];
var _restore = Module["_restore"] = asm["_restore"];
var _free = Module["_free"] = asm["_free"];
var _delete_transformer = Module["_delete_transformer"] = asm["_delete_transformer"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var _transform = Module["_transform"] = asm["_transform"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _memset = Module["_memset"] = asm["_memset"];
var _set_init_vector = Module["_set_init_vector"] = asm["_set_init_vector"];
var _set_key = Module["_set_key"] = asm["_set_key"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var _create_transformer = Module["_create_transformer"] = asm["_create_transformer"];
var _configure = Module["_configure"] = asm["_configure"];
var _testSetjmp = Module["_testSetjmp"] = asm["_testSetjmp"];
var __GLOBAL__I_a = Module["__GLOBAL__I_a"] = asm["__GLOBAL__I_a"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = asm["dynCall_viiiiiii"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = asm["dynCall_viiiiiiiii"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viiiiiid = Module["dynCall_viiiiiid"] = asm["dynCall_viiiiiid"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_viiiiid = Module["dynCall_viiiiid"] = asm["dynCall_viiiiid"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = asm["dynCall_iiiiiiiii"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = asm["dynCall_viiiiiiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];

Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };


// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======



// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.';

  throw 'abort() at ' + stackTrace() + extra;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}






var Transformer = (function () {
  var iv_size_ = 8;

  var generateRandomUint8Array = function (len) {
    var vector = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      vector[i] = (Math.random() + '').substr(3) & 255;
    }
    return vector;
  }

  var create_transformer = Module.cwrap('create_transformer', 'number', []);

  /**
   * Create a transformer instance.
   * @constructor
   */
  var Transformer = function () {
    this.handle_ = create_transformer();
    this.ciphertext_max_len_ = 0;
  };

  // int set_key(int handle, const unsigned char* key, uint32_t key_len)
  var set_key = Module.cwrap('set_key', 'number',
                             ['number', 'number', 'number']);

  /**
   * Sets the key for transformation session.
   *
   * @param {ArrayBuffer} key session key.
   * @return {boolean} true if successful.
   */
  Transformer.prototype.setKey = function (key) {
    var ptr = Module._malloc(key.byteLength);
    var dataHeap = new Uint8Array(Module.HEAPU8.buffer, ptr, key.byteLength);
    dataHeap.set(new Uint8Array(key));
    var ret = set_key(this.handle_, dataHeap.byteOffset, key.byteLength);
    Module._free(dataHeap.byteOffset);
    return ret == 0;
  };

  // int configure(int handle, const unsigned char* data,
  //                     uint32_t data_len)
  var configure = Module.cwrap('configure', 'number',
                               ['number', 'number', 'number']);
  /**
   * Performs configuration to the transformer. 
   *  
   * @param {String} serialized Json string.  
   */
  Transformer.prototype.configure = function (jsonStr) {
    var jsonStrArrayBuffer = str2ab(jsonStr);
    var jsonStrObj = JSON.parse(jsonStr);
    this.ciphertext_max_len_ = jsonStrObj.ciphertext_max_len;
    var ptr = Module._malloc(jsonStrArrayBuffer.byteLength);
    var dataHeap = new Uint8Array(Module.HEAPU8.buffer, ptr,
                                  jsonStrArrayBuffer.byteLength);
    dataHeap.set(new Uint8Array(jsonStrArrayBuffer));
    var ret = configure(this.handle_, dataHeap.byteOffset,
                        jsonStrArrayBuffer.byteLength);
    Module._free(dataHeap.byteOffset);
    return ret == 0;
  }

  // int set_init_vector(int handle, const unsigned char* data,
  //                     uint32_t data_len)
  var set_init_vector = Module.cwrap('set_init_vector', 'number',
                                     ['number', 'number', 'number']);
  var setInitVector = function (handle) {
    var iv = generateRandomUint8Array(iv_size_);
    var ptr = Module._malloc(iv.byteLength);
    var dataHeap = new Uint8Array(Module.HEAPU8.buffer, ptr, iv.byteLength);
    dataHeap.set(iv);
    var ret = set_init_vector(handle, dataHeap.byteOffset, iv.byteLength);
    Module._free(dataHeap.byteOffset);
    return ret == 0;
  }

  // int transform(int handle, const uint8_t* data, uint32_t data_len,
  //               uint8_t* output, uint32_t* output_len) {
  var transform = Module.cwrap('transform', 'number',
                               ['number', 'number', 'number', 'number',
                                'number']);

  /**
   * Transforms a piece of data to obfuscated form.
   *
   * @param {ArrayBuffer} plaintext data need to be obfuscated.
   * @return {?ArrayBuffer} obfuscated data, or null if failed.
   */
  Transformer.prototype.transform = function (plaintext) {
    if (!setInitVector(this.handle_)) {
      return null;
    }

    var plaintextLen = plaintext.byteLength;
    var ptr = Module._malloc(plaintextLen);
    var dataHeap1 = new Uint8Array(Module.HEAPU8.buffer, ptr, plaintextLen);
    dataHeap1.set(new Uint8Array(plaintext));

    var ciphertextLen = plaintextLen + iv_size_;
    if (this.ciphertext_max_len_) {
      ciphertextLen = this.ciphertext_max_len_;
    }
    ptr = Module._malloc(ciphertextLen);
    var dataHeap2 = new Uint8Array(Module.HEAPU8.buffer, ptr, ciphertextLen);

    ptr = Module._malloc(4);
    var dataHeap3 = new Uint8Array(Module.HEAPU8.buffer, ptr, 4);
    var data = new Uint32Array([ciphertextLen]);
    dataHeap3.set(new Uint8Array(data.buffer));

    var ret = transform(this.handle_,
      dataHeap1.byteOffset, plaintext.byteLength,
      dataHeap2.byteOffset, dataHeap3.byteOffset);

    if (ret != 0) {
      return null;
    }
    var length = (new Uint32Array(dataHeap3.buffer, dataHeap3.byteOffset, 4))[0];
    var result = new Uint8Array(length);
    result.set(new Uint8Array(dataHeap2.buffer, dataHeap2.byteOffset, length));

    Module._free(dataHeap1.byteOffset);
    Module._free(dataHeap2.byteOffset);
    Module._free(dataHeap3.byteOffset);

    return result.buffer;
  }

  // int restore(int handle, const uint8_t* data, uint32_t data_len,
  //             uint8_t* result, uint32_t* result_len) {
  var restore = Module.cwrap('restore', 'number',
                             ['number', 'number', 'number', 'number',
                              'number']);

  /**
   * Restores data from obfuscated form to original form.
   *
   * @param {ArrayBuffer} ciphertext obfuscated data.
   * @return {?ArrayBuffer} original data, or null if failed.
   */
  Transformer.prototype.restore = function (ciphertext) {
    var len = ciphertext.byteLength;
    var ptr = Module._malloc(len);
    var dataHeap1 = new Uint8Array(Module.HEAPU8.buffer, ptr, len);
    dataHeap1.set(new Uint8Array(ciphertext, 0, len));

    ptr = Module._malloc(len);
    var dataHeap2 = new Uint8Array(Module.HEAPU8.buffer, ptr, len);

    ptr = Module._malloc(4);
    var dataHeap3 = new Uint8Array(Module.HEAPU8.buffer, ptr, 4);
    var data = new Uint32Array([len]);
    dataHeap3.set(new Uint8Array(data.buffer));

    var ret = restore(this.handle_,
                      dataHeap1.byteOffset, ciphertext.byteLength,
                      dataHeap2.byteOffset, dataHeap3.byteOffset);
    if (ret != 0) {
      return null;
    }
    var len = (new Uint32Array(dataHeap3.buffer, dataHeap3.byteOffset, 4))[0];
    var result = new Uint8Array(len);
    result.set(new Uint8Array(dataHeap2.buffer, dataHeap2.byteOffset, len));
    Module._free(dataHeap1.byteOffset);
    Module._free(dataHeap2.byteOffset);
    Module._free(dataHeap3.byteOffset);
    return result.buffer;
  };

  var delete_transformer = Module.cwrap('delete_transformer', 'number',
                                        ['number']);

  /**
   * Dispose the transformer.
   *
   * This should be the last method to be called for a transformer
   * instance.
   */
  Transformer.prototype.dispose = function () {
    delete_transformer(this.handle_);
    this.handle_ = -1;
  }

  return Transformer;
}());