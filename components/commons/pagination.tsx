'use client';

import axios from 'axios';
import _ from 'lodash';
import queryString from 'query-string';
import React, { useState } from 'react';
import { CSSProperties } from 'styled-components';

import { useApiCallStore } from '@/providers';
import { layoutStore, TApiData } from '@/stores';

import { GridItem } from '../grid-systems/const';

type TProps = {
  data?: any;
  style?: CSSProperties;
};
const Pagination: React.FC<TProps> = ({ style, data }) => {
  console.log('🚀 ~ data:', data);
  const { data: layout } = layoutStore();
  const { updateApiData, apiData } = useApiCallStore((state) => state);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10; // You can make this dynamic based on your data

  // Handler functions
  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const findComponentHaveAPI = (
    component: GridItem,
    apiCallPagination: TApiData
  ): GridItem | null => {
    // Kiểm tra component hiện tại
    if (component?.valueRender?.apiCall?.id === apiCallPagination.id) {
      return component;
    }

    // Kiểm tra các childs
    if (component?.childs?.length) {
      for (const child of component.childs) {
        const foundComponent = findComponentHaveAPI(child, apiCallPagination);
        if (foundComponent) {
          return foundComponent; // Trả về component nếu tìm thấy
        }
      }
    }

    // Trả về null nếu không tìm thấy
    return null;
  };

  const handlePageClick = async (page: number) => {
    console.log('🚀 ~ handlePageClick ~ page:', page);
    const desktop = layout?.desktop;
    const dynamicGenarateDiv = findComponentHaveAPI(desktop, data.valueRender.apiCall);

    if (!dynamicGenarateDiv) return;
    console.log('🚀 ~ handlePageClick ~ before:', dynamicGenarateDiv);

    // handle old url
    const query = queryString.parseUrl(dynamicGenarateDiv.valueRender?.apiCall?.url ?? '');
    console.log('🚀 ~ handlePageClick ~ query:', query);

    //update new url
    _.update(dynamicGenarateDiv, 'valueRender.apiCall.url', (url) =>
      queryString.stringifyUrl({
        url,
        query: { ...query.query, skip: page * ((Number(query.query?.limit) || 1) - 1) },
      })
    );
    console.log('🚀 ~ handlePageClick ~ after:', dynamicGenarateDiv);

    // updateUrlForChilds(dynamicGenarateDiv!, dynamicGenarateDiv?.valueRender?.apiCall?.url ?? '');
    const existedApiData = apiData.find(
      (item) => item.id === dynamicGenarateDiv?.valueRender?.apiCall?.id
    );

    try {
      const { url, method } = dynamicGenarateDiv?.valueRender?.apiCall ?? {};
      const updateValueApi = (await axios.request({ url, method: method?.toLocaleLowerCase() }))
        .data;
      if (!_.isEmpty(existedApiData)) updateApiData(existedApiData.id, updateValueApi);

      console.log('🚀 ~ handlePageClick ~ updateValueApi:', updateValueApi);
    } catch (error) {
      console.log('🚀 ~ handlePageClick ~ error:', error);
    }

    // const dom = document.getElementById(dynamicGenarateDiv?.id ?? '');
    // console.log('🚀 ~ handlePageClick ~ dom:', dom);
    // const gridRender = <RenderGrid items={dynamicGenarateDiv?.childs ?? []} />;
    // // const gridRender = <div>text</div>;
    // console.log('🚀 ~ handlePageClick ~ gridRender:', gridRender);

    // if (dom && gridRender) {
    //   // Render React component vào wrapper
    //   const root = createRoot(dom);
    //   // console.log('🚀 ~ handlePageClick ~ root:', root);

    //   root.render(gridRender);

    //   // Thêm wrapper vào DOM
    // }
    setCurrentPage(page);
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    // const pages = [];
    const maxVisiblePages = 4;

    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="bg-white py-10 text-center dark:bg-dark" style={style}>
      <div className="mb-12 inline-flex justify-center rounded bg-white p-3 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.13)] dark:bg-dark-2">
        <ul className="inline-flex overflow-hidden rounded-lg border border-stroke dark:border-white/5">
          {/* Previous Button */}
          <li>
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="flex h-10 min-w-10 items-center justify-center border-r border-stroke px-2 text-base font-medium text-dark hover:bg-gray-2 disabled:opacity-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
            >
              <svg
                width="20"
                height="21"
                viewBox="0 0 20 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.5 9.8125H4.15625L9.46875 4.40625C9.75 4.125 9.75 3.6875 9.46875 3.40625C9.1875 3.125 8.75 3.125 8.46875 3.40625L2 9.96875C1.71875 10.25 1.71875 10.6875 2 10.9688L8.46875 17.5312C8.59375 17.6562 8.78125 17.75 8.96875 17.75C9.15625 17.75 9.3125 17.6875 9.46875 17.5625C9.75 17.2812 9.75 16.8438 9.46875 16.5625L4.1875 11.2188H17.5C17.875 11.2188 18.1875 10.9062 18.1875 10.5312C18.1875 10.125 17.875 9.8125 17.5 9.8125Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </li>

          {/* Page Numbers */}
          {getPageNumbers().map((page, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => typeof page === 'number' && handlePageClick(page)}
                disabled={typeof page !== 'number'}
                className={`cursor-pointer flex h-10 min-w-10 items-center justify-center border-r border-stroke px-2 text-base font-medium ${
                  currentPage === page
                    ? 'bg-gray-2 dark:bg-white/10'
                    : 'text-dark hover:bg-gray-2 dark:text-white dark:hover:bg-white/5'
                } dark:border-white/10`}
              >
                {page}
              </button>
            </li>
          ))}

          {/* Next Button */}
          <li>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="flex h-10 min-w-10 items-center justify-center px-2 text-base font-medium text-dark hover:bg-gray-2 disabled:opacity-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
            >
              <svg
                width="20"
                height="21"
                viewBox="0 0 20 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 10L11.5312 3.4375C11.25 3.15625 10.8125 3.15625 10.5312 3.4375C10.25 3.71875 10.25 4.15625 10.5312 4.4375L15.7812 9.78125H2.5C2.125 9.78125 1.8125 10.0937 1.8125 10.4688C1.8125 10.8438 2.125 11.1875 2.5 11.1875H15.8437L10.5312 16.5938C10.25 16.875 10.25 17.3125 10.5312 17.5938C10.6562 17.7188 10.8437 17.7812 11.0312 17.7812C11.2187 17.7812 11.4062 17.7188 11.5312 17.5625L18 11C18.2812 10.7187 18.2812 10.2812 18 10Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};
export default Pagination;
