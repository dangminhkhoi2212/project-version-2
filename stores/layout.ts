import { create } from 'zustand';

type TStore = {
  data: any;
};

type TActions = {
  setData: (data: any) => void;
  updateData: (id: string, data: any) => void;
};

// Hàm đệ quy để tìm kiếm và cập nhật đối tượng
const updateItem = (id: string, newData: any, source: any) => {
  // Nếu tìm thấy đối tượng cần cập nhật
  if (source.id === id) {
    return { ...source, ...newData }; // Trả về bản sao mới với dữ liệu được cập nhật
  }

  // Nếu có `childs`, duyệt qua từng phần tử
  if (source.childs) {
    return {
      ...source,
      childs: source.childs.map((child: any) => updateItem(id, newData, child)), // Đệ quy cập nhật từng child
    };
  }

  // Trả về bản sao của đối tượng nếu không tìm thấy
  return source;
};

const initValue = {
  data: null,
};

export const layoutStore = create<TStore & TActions>((set) => ({
  ...initValue,
  setData: (data: any) => {
    console.log('🚀setData ~ data:', data);
    set(() => {
      return {
        data: data,
      };
    });
  },
  updateData: (id, newData) => {
    set((state) => {
      const updateData = updateItem(id, newData, state.data);
      console.log('🚀 ~ set ~ updateData:', updateData);
      return {
        data: updateData, // Cập nhật dữ liệu bằng cách sử dụng hàm đệ quy
      };
    });
  },
}));
