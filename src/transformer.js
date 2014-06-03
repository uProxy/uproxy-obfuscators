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
    this.ciphertext_max_len_ = false;
  };

  // int set_key(int handle, const unsigned char* key, uint32_t key_len)
  var set_key = Module.cwrap('set_key', 'number', ['number', 'number', 'number']);

  /**
   * Sets the key for transformation session.
   *
   * @param {Uint8Array} key session key.
   * @return {boolean} true if successful.
   */
  Transformer.prototype.setKey = function (key) {
    var ptr = Module._malloc(key.byteLength);
    var dataHeap = new Uint8Array(Module.HEAPU8.buffer, ptr, key.byteLength);
    dataHeap.set(key);
    var ret = set_key(this.handle_, dataHeap.byteOffset, key.byteLength);
    Module._free(dataHeap.byteOffset);
    return ret == 0;
  };

  // int configure(int handle, const unsigned char* data,
  //                     uint32_t data_len)
  var configure = Module.cwrap('configure', 'number', ['number', 'number', 'number']);
  Transformer.prototype.configure = function (jsonStr) {
    var jsonStrE = ab2str8(jsonStr);
    var jsonStrO = JSON.parse(jsonStrE);
    this.ciphertext_max_len_ = jsonStrO.ciphertext_max_len;
    var ptr = Module._malloc(jsonStr.byteLength);
    var dataHeap = new Uint8Array(Module.HEAPU8.buffer, ptr, jsonStr.byteLength);
    dataHeap.set(new Uint8Array(jsonStr.buffer));
    var ret = configure(this.handle_, dataHeap.byteOffset, jsonStr.byteLength);
    Module._free(dataHeap.byteOffset);
    return ret == 0;
  }

  // int set_init_vector(int handle, const unsigned char* data,
  //                     uint32_t data_len)
  var set_init_vector = Module.cwrap('set_init_vector', 'number', ['number', 'number', 'number']);
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
  var transform = Module.cwrap('transform', 'number', ['number', 'number', 'number',
    'number', 'number'
  ]);

  /**
   * Transforms a piece of data to obfuscated form.
   *
   * @param {Uint8Array} plaintext data need to be obfuscated.
   * @return {?Uint8Array} obfuscated data, or null if failed.
   */
  Transformer.prototype.transform = function (plaintext) {
    if (!setInitVector(this.handle_)) {
      return null;
    }

    var plaintext_len = plaintext.byteLength;
    var ptr = Module._malloc(plaintext_len);
    var dataHeap1 = new Uint8Array(Module.HEAPU8.buffer, ptr, plaintext_len);
    dataHeap1.set(new Uint8Array(plaintext.buffer));

    var ciphertext_len = plaintext_len + iv_size_;
    if (this.ciphertext_max_len_) {
      ciphertext_len = this.ciphertext_max_len_;
    }
    ptr = Module._malloc(ciphertext_len);
    var dataHeap2 = new Uint8Array(Module.HEAPU8.buffer, ptr, ciphertext_len);

    ptr = Module._malloc(4);
    var dataHeap3 = new Uint8Array(Module.HEAPU8.buffer, ptr, 4);
    var data = new Uint32Array([ciphertext_len]);
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

    return result;
  }

  // int restore(int handle, const uint8_t* data, uint32_t data_len,
  //             uint8_t* result, uint32_t* result_len) {
  var restore = Module.cwrap('restore', 'number', ['number', 'number', 'number', 'number',
    'number'
  ]);

  /**
   * Restores data from obfuscated form to original form.
   *
   * @param {Uint8Array} ciphertext obfuscated data.
   * @return {?Uint8Array} original data, or null if failed.
   */
  Transformer.prototype.restore = function (ciphertext) {
    var len = ciphertext.byteLength;
    var ptr = Module._malloc(len);
    var dataHeap1 = new Uint8Array(Module.HEAPU8.buffer, ptr, len);
    dataHeap1.set(new Uint8Array(ciphertext.buffer, 0, len));

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
    var length = (new Uint32Array(dataHeap3.buffer, dataHeap3.byteOffset, 4))[0];
    var result = new Uint8Array(length);
    result.set(new Uint8Array(dataHeap2.buffer, dataHeap2.byteOffset, length));
    Module._free(dataHeap1.byteOffset);
    Module._free(dataHeap2.byteOffset);
    Module._free(dataHeap3.byteOffset);
    return result;
  };

  var delete_transformer = Module.cwrap('delete_transformer', 'number', ['number']);

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