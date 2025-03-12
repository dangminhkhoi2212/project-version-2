import axios from 'axios';
import { JSONPath } from 'jsonpath-plus';
import _ from 'lodash';

import { TApiData } from '@/stores';

import { GridItem, ValueRender } from '../components/grid-systems/const';

const allowTypeGenerate = ['flex', 'grid'];
// Hàm lấy dữ liệu từ API hoặc store
const getDataFromApi = async (
  apiData: TApiData[],
  idParent: string,
  apiCall: Pick<ValueRender, 'apiCall'>['apiCall']
) => {
  const existingApiData = apiData.find(
    (item: any) => item.id === apiCall?.id || item.idParent === idParent
  );
  if (!_.isEmpty(existingApiData)) return existingApiData.data;

  const response = await axios.request({
    url: apiCall?.url,
    method: apiCall?.method.toLowerCase(),
  });
  const data = response.data;

  return data;
};

// Hàm cập nhật jsonPath theo index của card
const updateJsonPath = (jsonPath: string, index: number) => {
  return _.replace(jsonPath, /\[\d*\]/, `[${index}]`);
};

const updateJsonPathForChild = (slice: GridItem, index: number) => {
  const updateSlide = {
    ...slice,
    valueRender: {
      ...slice.valueRender,
      jsonPath: updateJsonPath(slice.valueRender?.jsonPath ?? '', index),
    },
  };
  const childs = updateSlide.childs;

  if (!childs?.length) return updateSlide;

  const updateChilds = childs.map((child) => updateJsonPathForChild(child, index));
  updateSlide.childs = updateChilds;

  return updateSlide;
};
// Hàm tạo các card từ dữ liệu API
const createCardsFromApi = (sliceRef: GridItem, apiData: any, jsonPath: string) => {
  if (!allowTypeGenerate.includes(sliceRef.type) || !sliceRef.valueRender?.allowDynamicGenerate) {
    return sliceRef.childs;
  }
  let apiDataHaveJsonPath = apiData;
  if (jsonPath) {
    apiDataHaveJsonPath = JSONPath({ json: apiData, path: jsonPath })[0];
  }

  const childs = sliceRef.childs?.filter((value: GridItem) =>
    allowTypeGenerate.includes(value.type ?? '')
  );

  if (_.isEmpty(childs)) return [];

  const newCards = _.flatMap(_.range(apiDataHaveJsonPath.length), (index) =>
    _.map(childs, (value: GridItem) => {
      const newChild = {
        ...value,
        valueRender: {
          ...(value.valueRender ?? {}),
          index,
        },
      };
      if (newChild?.childs?.length) {
        newChild.childs = newChild.childs.map((child) => updateJsonPathForChild(child, index));
      }

      return newChild;
    })
  );

  return newCards;
};

const updateTitleInText = (sliceRef: GridItem, result: any): string | undefined => {
  if (!sliceRef?.valueRender?.jsonPath) return;

  const jsonPath = sliceRef.valueRender?.jsonPath;
  // console.log(`🚀 ~ updateTitleInText ~ jsonPath: ${sliceRef.id}`, jsonPath);

  if (_.isEmpty(jsonPath)) return;
  const title = JSONPath({ path: jsonPath!, json: result });

  // console.log(`🚀 ~ fetchData ~ title: ${sliceRef.id}`, title);
  return title;
};
export const dynamicGenarateUtil = {
  getDataFromApi,
  createCardsFromApi,
  updateTitleInText,
};
