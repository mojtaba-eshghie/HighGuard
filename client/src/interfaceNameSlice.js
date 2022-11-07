import { createSlice } from '@reduxjs/toolkit'

export const interfaceNameSlice = createSlice({
  name: 'interfaceName',
  initialState: {
    value: '',
  },
  reducers: {
    setInterfaceName: (state, action) => {
      state.value = action.payload;
    },
  },
})

// Action creators are generated for each case reducer function
export const { setInterfaceName } = interfaceNameSlice.actions

export default interfaceNameSlice.reducer