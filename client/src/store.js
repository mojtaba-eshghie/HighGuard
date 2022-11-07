import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './interfaceFileSlice'
console.log(counterReducer);

export default configureStore({
  reducer: {
    interfaceFile: counterReducer
  },
})