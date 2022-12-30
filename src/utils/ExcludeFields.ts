const excludeFieldsFromObjArray = (data: any, fields: string[]) => {
  data.forEach((eachData: any) => {
    for (const field of fields) {
      delete eachData[field];
    }
  });

  return data;
};

const excludeFieldsFromObj = (data: any, fields: string[]) => {
  for (const field of fields) {
    delete data[field];
  }

  return data;
};

export const excludeFields = (data: any, fields: string[]) => {
  const providedData = data;

  if (Array.isArray(providedData))
    return excludeFieldsFromObjArray(providedData, fields);

  return excludeFieldsFromObj(providedData, fields);
};
