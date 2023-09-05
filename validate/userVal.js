const Joi = require('joi');

function validateUser(user) {
  const JoiSchema = Joi.object({
    email: Joi.string().email({
        minDomainSegments:2,
        tlds:{allow:["com","in"]}
    }).min(5).max(60).required(),
    password: Joi.string().min(2).max(30).required(),
    name: Joi.string().min(2).max(30).required(),
  }).options({ abortEarly: false, allowUnknown: true });

  return JoiSchema.validate(user);
}

module.exports = validateUser;