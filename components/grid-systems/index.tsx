'use client';
import axios from 'axios';
import { JSONPath } from 'jsonpath-plus';
import _ from 'lodash';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import { rebuilComponentMonaco } from '@/app/actions/use-constructor';
import { CONFIGS } from '@/configs';
import { componentRegistry } from '@/lib/slices';
import { getDeviceSize } from '@/lib/utils';
import { apiCallStore, TApiData } from '@/stores';

import NotFound from './404';
import {
  GapGrid,
  GridItem,
  GridRow,
  mapAlineItem,
  mapJustifyContent,
  SpanCol,
  SpanRow,
  ValueRender,
} from './const';
import LoadingPage from './loadingPage';
import { GridSystemProps, RenderGripProps } from './types';

const allowTypeGenerate = ['flex', 'grid'];
// Hàm lấy dữ liệu từ API hoặc store
const getDataFromApi = async (
  apiData: TApiData[],
  apiCall: Pick<ValueRender, 'apiCall'>['apiCall']
) => {
  const existingApiData = apiData.find((item: any) => item.id === apiCall?.id);
  if (!_.isEmpty(existingApiData)) return existingApiData.data;
  console.log('🚀 ~ existingApiData:', existingApiData);

  const response = await axios.request({
    url: apiCall?.url,
    method: apiCall?.method.toLowerCase(),
  });
  return response.data;
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
const createCardsFromApi = (sliceRef: GridItem, apiData: any) => {
  if (!allowTypeGenerate.includes(sliceRef.type) || !sliceRef.valueRender?.allowDynamicGenerate) {
    return sliceRef.childs;
  }

  const childs = sliceRef.childs?.filter((value: GridItem) =>
    allowTypeGenerate.includes(value.type ?? '')
  );

  if (_.isEmpty(childs)) return [];

  const newCards = _.flatMap(_.range(apiData.length), (index) =>
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
type TRenderSlice = { slice: GridItem | null | undefined; indexParent?: number };
const RenderSlice: React.FC<TRenderSlice> = ({ slice }) => {
  const { apiData, addApiData } = apiCallStore();
  const [sliceRef, setSliceRef] = useState<GridItem | null | undefined>(slice);

  useEffect(() => {
    if (!sliceRef) return;

    const fetchData = async () => {
      // Hàm cập nhật tiêu đề cho text hoặc description

      try {
        if (!sliceRef?.valueRender?.apiCall) return;

        const { apiCall } = sliceRef.valueRender;

        // Lấy dữ liệu từ API hoặc store
        const result = await getDataFromApi(apiData, apiCall);

        if (!_.isEmpty(result)) {
          addApiData({ id: apiCall?.id ?? Date.now(), data: result });
        }

        // Tạo các card từ dữ liệu API
        const newCards = createCardsFromApi(sliceRef, result);

        // console.log(`🚀 ~ fetchData ~ newCards: ${sliceRef.id}`, newCards);

        // Cập nhật tiêu đề cho content
        const title = updateTitleInText(sliceRef, result);
        // Cập nhật sliceRef với các card mới
        setSliceRef((prev) => ({
          ...prev,
          dataSlice: { title: _.isArray(title) ? title[0] : title },
          childs: newCards as GridItem[],
          type: prev?.type || 'grid',
        }));
      } catch (error) {
        console.error('Error fetching API data:', error);
      }
    };

    fetchData();
  }, [addApiData, slice]);

  if (!sliceRef) return null;
  const styleDevice: string = getDeviceSize() as string;

  const key = sliceRef?.id?.split('$')[0];
  const SliceComponent = componentRegistry[key as keyof typeof componentRegistry];

  if (!SliceComponent && !sliceRef?.childs) return null;

  const isGrid = sliceRef?.type === 'grid' ? 'grid' : '';
  const isFlexBox = sliceRef?.type === 'flex';
  const isButton = key === 'button';

  const styleSlice = (_.get(sliceRef, [styleDevice]) as React.CSSProperties) || sliceRef?.style;

  const sliceClasses = [
    sliceRef?.colspan ? SpanCol(Number(sliceRef.colspan)) : '',
    sliceRef?.rowspan ? SpanRow(Number(sliceRef.rowspan)) : '',
    sliceRef?.rows ? GridRow(Number(sliceRef.rows)) : '',
    sliceRef?.gap ? GapGrid(Number(sliceRef.gap)) : '',
    isGrid,
    isFlexBox && mapJustifyContent(sliceRef?.justifyContent),
    isFlexBox && mapAlineItem(sliceRef?.alignItems),
    isFlexBox && 'flex',
  ]
    .filter(Boolean)
    .join(' ');

  const inlineStyles: React.CSSProperties = {
    ...(styleSlice || {}),
    gridTemplateColumns: isGrid ? `repeat(${sliceRef?.columns}, 1fr)` : '',
  };

  const content = SliceComponent ? (
    <SliceComponent style={styleSlice} data={_.get(sliceRef, 'dataSlice')} />
  ) : (
    sliceRef?.childs && <RenderGrid items={sliceRef.childs} />
  );

  return sliceClasses || Object.keys(inlineStyles).length ? (
    <div className={`${sliceClasses}`} style={isButton ? {} : inlineStyles}>
      {content}
    </div>
  ) : null;
};

const RenderGrid = ({ items }: RenderGripProps) => {
  return (
    <>
      {_.map(items, (slice, index) => (
        <RenderSlice slice={slice} key={index} />
      ))}
    </>
  );
};

const GridSystemContainer = ({ page, deviceType }: GridSystemProps) => {
  const [layout, setLayout] = useState<GridItem | null>(null);

  const config = layout || page;
  const [refreshKey, setRefreshKey] = useState(0);
  const previousComponentRef = useRef(null);

  const MonacoContainerRoot = useMemo(() => {
    return dynamic(() => import('@/components/grid-systems/monacoContainer'), {
      ssr: false,
      loading: () => <LoadingPage />,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]); // ✅

  const content = (
    <div className="mx-auto flex justify-center">
      {config?.childs ? (
        <div className="w-full flex flex-col justify-center flex-wrap overflow-auto">
          <RenderGrid items={config.childs} />
        </div>
      ) : (
        <NotFound />
      )}
    </div>
  );

  useEffect(() => {
    const socket = io(CONFIGS.SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });
    socket.on('connected', () => console.log('connected'));
    socket.on('return-json', async (data) => {
      if (data?.component && data.component !== previousComponentRef.current) {
        previousComponentRef.current = data.component;
        setRefreshKey((prev) => prev + 1);
        await rebuilComponentMonaco(data.component);
      }
      if (data?.layout) {
        setTimeout(() => setLayout(data.layout[deviceType]), 0);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [deviceType]);

  if (!MonacoContainerRoot || typeof MonacoContainerRoot !== 'function') {
    return <>{content}</>;
  }

  return (
    <div className="overflow-hidden">
      <MonacoContainerRoot key={refreshKey}>{content}</MonacoContainerRoot>
    </div>
  );
};

export default GridSystemContainer;
