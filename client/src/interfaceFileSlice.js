import { createSlice } from '@reduxjs/toolkit'

export const interfaceFileSlice = createSlice({
  name: 'interfaceFile',
  initialState: {
    value: null,
  },
  reducers: {
    setInterfaceFile: (state, action) => {
      state.value = action.payload;
    },
  },
})

// Action creators are generated for each case reducer function
export const { setInterfaceFile } = interfaceFileSlice.actions

export default interfaceFileSlice.reducer