import { configureStore } from '@reduxjs/toolkit'
import interfaceReducer from './interfaceNameSlice'

export default configureStore({
  reducer: {
    interfaceName: interfaceReducer
  },
})