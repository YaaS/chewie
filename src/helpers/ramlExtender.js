const log = require('./logger');

/**
 * This function extends RAML object, dereferences $ref keys
 * @param {object} [objectRaml] - RAML object to extend
 */
function extend(objectRaml){
  const schemas = _getSchemas(objectRaml);
  if(!schemas)
    return objectRaml;
  const resolve = _refsResolver(schemas);
  resolve(objectRaml);
}

function _refsResolver(schemas){

  return function _resolveRefs(object){
    try {
      if(!object) return;

      if(Array.isArray(object)){
        object.forEach((item) => _resolveRefs(item));
      }

      if(typeof object === 'object'){
        Object.keys(object).forEach((key) => {

          const value = object[key];
          if(typeof value !== 'string')
            return _resolveRefs(object[key]);
          
          object[key] = _getResolvedString(value, schemas); 
        });
      }
    }
    catch(err){
      log.error('_refsResolver', err);
    }
  };

}

function _getResolvedString(string, schemas){
  try {
    const object = JSON.parse(string);
    const extendObject = _objectExtender(schemas);
    extendObject(object);
    return JSON.stringify(object, null, 4);
  }
  catch(err){
    log.error('_getResolvedString', err);
    return string;
  }
}

function _objectExtender(schemas){

  return function _extendObject(object){
    try {
      Object.keys(object).forEach((key) => {
        const value = object[key];

        if(typeof value === 'object')
          return _extendObject(value);

        if(key === '$ref'){
          const refName = value;
          const schema = schemas[refName];
          if(!schema)
            return;

          delete object[key];
          Object.assign(object, schema);
        }
      });
    }
    catch(err){
      log.error('_objectExtender', err);
    }
  };

}

function _getSchemas(raml){
  if(!raml || !Array.isArray(raml.schemas) || !raml.schemas.length)
    return null;

  const schemas = raml.schemas.reduce((result, schema) => {
    Object.keys(schema).forEach((key) => result[key] = JSON.parse(schema[key]));
    return result;
  }, {});

  return schemas;
}

const ramlExtender = {
  extend
};

module.exports = ramlExtender;