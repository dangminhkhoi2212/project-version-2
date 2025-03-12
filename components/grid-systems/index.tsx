'use client';
import _ from 'lodash';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import { rebuilComponentMonaco } from '@/app/actions/use-constructor';
import { CONFIGS } from '@/configs';
import { componentRegistry } from '@/lib/slices';
import { getDeviceSize } from '@/lib/utils';
import { useApiCallStore } from '@/providers';
import { dynamicGenarateUtil } from '@/uitls/dynamicGenarate';

import NotFound from './404';
import {
  GapGrid,
  GridItem,
  GridRow,
  mapAlineItem,
  mapJustifyContent,
  SpanCol,
  SpanRow,
} from './const';
import LoadingPage from './loadingPage';
import { GridSystemProps, RenderGripProps } from './types';

const componentHasAction = ['pagination'];
const allowUpdateTitle = ['content'];
type TRenderSlice = { slice: GridItem | null | undefined; idParent: string };

const RenderSlice: React.FC<TRenderSlice> = ({ slice }) => {
  const { apiData } = useApiCallStore((state) => state);
  console.log('🚀 ~ apiData:', apiData);
  const { updateTitleInText } = dynamicGenarateUtil;
  const [sliceRef, setSliceRef] = useState<GridItem | null | undefined>(slice);

  useEffect(() => {
    console.log('RenderSlice apiData', apiData);

    if (
      sliceRef &&
      !_.isEmpty(sliceRef?.valueRender?.jsonPath) &&
      allowUpdateTitle.includes(sliceRef.type)
    ) {
      const { apiCall } = sliceRef.valueRender || {};
      const valueJson = apiData.find((item) => item.id === apiCall?.id);
      // Cập nhật tiêu đề cho content
      const title = updateTitleInText(sliceRef, valueJson?.data);
      console.log('🚀RenderSlice 2', { apiData, title });
      // Cập nhật sliceRef với các card mới
      setSliceRef((prev) => ({
        ...prev,
        dataSlice: { title: _.isArray(title) ? title[0] : title },
        type: prev?.type || 'grid',
      }));
    }
  }, [apiData]);

  const data = useMemo(() => {
    const key = sliceRef?.id?.split('$')[0];
    return componentHasAction.includes(key!) ? sliceRef : _.get(sliceRef, 'dataSlice');
  }, [sliceRef]);

  const styleDevice: string = getDeviceSize() as string;

  const key = sliceRef?.id?.split('$')[0];

  const SliceComponent = componentRegistry[key as keyof typeof componentRegistry];

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
    <SliceComponent style={styleSlice} data={data} />
  ) : (
    sliceRef?.childs && (
      <RenderGrid items={sliceRef.childs} idParent={sliceRef.id!} slice={sliceRef} />
    )
  );
  // useEffect(() => {
  //   if (!sliceRef) return;
  //   if (idParent.toLocaleUpperCase() === 'GRID-19A3932D-DA05-43BF-B541-AD8E66A1C70B')
  //     console.log('🚀 RenderGrid~ idParent child:', sliceRef.id);
  //   const fetchData = async () => {
  //     // Hàm cập nhật tiêu đề cho text hoặc description
  //     console.log(sliceRef.id?.toLocaleUpperCase());

  //     try {
  //       if (!sliceRef?.valueRender?.apiCall?.id) return;

  //       const { apiCall, jsonPath } = sliceRef.valueRender;
  //       console.log('🚀 ~ fetchData ~ apiCall:', { apiCall, apiData, sliceRef });

  //       // Lấy dữ liệu từ API hoặc store
  //       const existingApiData = apiData.find(
  //         (item: any) => item.id === apiCall?.id || item.idParent === idParent
  //       );
  //       let result = null;
  //       if (sliceRef.valueRender.allowDynamicGenerate) {
  //         result = await getDataFromApi(apiData, idParent, apiCall);
  //         console.log('🚀 ~ fetchData ~ result:', { result, length: result.length });
  //         const newCards = createCardsFromApi(sliceRef, result, jsonPath ?? '');
  //         console.log('🚀 ~ fetchData ~ newCards:', newCards);
  //         setSliceRef((prev) => ({
  //           ...prev,
  //           childs: newCards as GridItem[],
  //           type: prev?.type || 'grid',
  //         }));
  //       }

  //       // if (!_.isEmpty(result) && !existingApiData) {
  //       //   addApiData({ id: apiCall?.id ?? Date.now(), idParent, data: result });
  //       // } else {
  //       //   updateApiData({ id: apiCall?.id ?? Date.now(), idParent: sliceRef.id!, data: result });
  //       // }

  //       // // Tạo các card từ dữ liệu API

  //       // // console.log(`🚀 ~ fetchData ~ newCards: ${sliceRef.id}`, newCards);
  //       if (
  //         !_.isEmpty(sliceRef?.valueRender?.jsonPath) &&
  //         allowUpdateTitle.includes(sliceRef.type)
  //       ) {
  //         // Cập nhật tiêu đề cho content
  //         const title = updateTitleInText(sliceRef, result);
  //         console.log('🚀 ~ fetchData ~ title:', {
  //           jsonPath,
  //           result,
  //           title: JSONPath({ json: result, path: jsonPath ?? '' }),
  //         });
  //         // Cập nhật sliceRef với các card mới
  //         setSliceRef((prev) => ({
  //           ...prev,
  //           dataSlice: { title: _.isArray(title) ? title[0] : title },
  //           type: prev?.type || 'grid',
  //         }));
  //       }
  //     } catch (error) {
  //       console.error('Error fetching API data:', error);
  //     }
  //   };

  //   fetchData();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  return sliceClasses || Object.keys(inlineStyles).length ? (
    <div className={`${sliceClasses}`} style={isButton ? {} : inlineStyles} id={sliceRef?.id}>
      {content}
    </div>
  ) : null;
};

export const RenderGrid: React.FC<RenderGripProps> = ({ idParent, slice }) => {
  const { apiData, addApiData } = useApiCallStore((state) => state);
  const [sliceRef, setSliceRef] = useState<GridItem | null | undefined>(slice);
  const { createCardsFromApi, getDataFromApi } = dynamicGenarateUtil;

  useEffect(() => {
    console.log('RenderGrid', apiData);
  }, [apiData]);
  useEffect(() => {
    if (!sliceRef) return;

    const fetchData = async () => {
      // Hàm cập nhật tiêu đề cho text hoặc description

      try {
        if (!sliceRef?.valueRender?.apiCall?.id) return;

        const { apiCall, jsonPath } = sliceRef.valueRender;
        let result = null;
        if (sliceRef.valueRender.allowDynamicGenerate) {
          const {
            apiCall: { id },
          } = sliceRef.valueRender;
          result = await getDataFromApi(apiData, idParent, apiCall);
          if (!_.isEmpty(result)) {
            addApiData({ id, data: result, idParent });
          }
          console.log('🚀RenderGrid 1');
          const newCards = createCardsFromApi(sliceRef, result, jsonPath ?? '');
          console.log('🚀 ~ fetchData ~ newCards:', newCards);
          setSliceRef((prev) => ({
            ...prev,
            childs: newCards as GridItem[],
            type: prev?.type || 'grid',
          }));
        }
      } catch (error) {
        console.error('Error fetching API data:', error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      {_.map(sliceRef?.childs, (slice, index) => (
        <RenderSlice slice={slice} key={index} idParent={idParent} />
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
        <div className="w-full flex flex-col justify-center flex-wrap overflow-auto" id={config.id}>
          <RenderGrid items={config.childs} idParent={config.id!} slice={config} />
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
