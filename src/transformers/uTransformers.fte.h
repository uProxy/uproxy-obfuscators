#ifndef __FTE_TRANSFORMER_H__
#define __FTE_TRANSFORMER_H__

#include <string>

#include "transformer.h"

#include "fte/fte.h"


class FteTransformer : public Transformer {
 public:
  FteTransformer();

  virtual ~FteTransformer() {};

  virtual bool SetKey(const uint8_t* key_str, uint32_t key_len);

  virtual bool SetInitVector(const uint8_t* data, uint32_t data_len);

  virtual bool Configure(const uint8_t* config_data,
                         uint32_t config_data_len);

  virtual bool Transform(const uint8_t* data, uint32_t data_len,
                         std::vector<std::string>& transformed_data);

  virtual bool FlushTransform(std::vector<std::string>& transformed_data);

  virtual bool Restore(const uint8_t* data, uint32_t data_len,
                       std::string& result);

  virtual TransformerError GetErrorInfo(std::string* detail = NULL) {
    return eTransformNoneError;
  }

 protected:
  fte::Fte  cryptor_;
  std::string  key_;
};

#endif // __FTE_TRANSFORMER_H__
