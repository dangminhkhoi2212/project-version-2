import { create, createStore } from 'zustand';

export type TApiData = Record<string, string>;
export type TApiCallData = {
  apiData: TApiData[];
};
export type TApiStoreActions = {
  addApiData: (data: TApiData) => void;
  updateApiData: (data: TApiData) => void;
  removeApiData: (id: string) => void;
};
export const initApiCallStore = () => ({
  apiData: [],
});
const defaultApiData = {
  apiData: [],
};
export type TApiCallStore = TApiCallData & TApiStoreActions;
export const createApiCallStore = (initState: TApiCallData = defaultApiData) => {
  return createStore<TApiCallStore>()((set) => ({
    ...initState,
    addApiData: (data: TApiData) => set((state) => ({ apiData: [...state.apiData, data] })),
    updateApiData(data) {
      set((state) => ({
        apiData: state.apiData.map((item) => (item.id === data.id ? data : item)),
      }));
    },
    removeApiData: (id: string) =>
      set((state) => ({ apiData: state.apiData.filter((item) => item.id !== id) })),
  }));
};
export const apiCallStore = create<TApiCallStore>((set) => ({
  ...defaultApiData,
  addApiData: (data: TApiData) => set((state) => ({ apiData: [...state.apiData, data] })),
  updateApiData(data) {
    set((state) => ({
      apiData: state.apiData.map((item) => (item.id === data.id ? data : item)),
    }));
  },
  removeApiData: (id: string) =>
    set((state) => ({ apiData: state.apiData.filter((item) => item.id !== id) })),
}));
