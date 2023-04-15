import Joi from 'joi';

export const validate = (schema, data) => {
  const result = schema.validate(data);
  if(result.error) return result.error.details.map(detail => detail.message).join('\n');
  return result.value;
};

export const ruleId = {
  id: Joi.number().required().integer().greater(0).messages({
    'any.required': 'Идентификатор не передан',
    'number.base': 'Идентификатор не является целым числом',
    'number.greater': 'Идентификатор не может быть отрицательным',
  })
};

export const ruleName = {
  name: Joi.string().required().trim().messages({
    'any.required': 'Название не передано',
    'string.empty': 'Название не может быть пустым'
  })
};