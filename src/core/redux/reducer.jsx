import initialState from "./initial.value";

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case "Layoutstyle_data":
      return { ...state, layoutstyledata: action.payload };
    default:
      return state;
  }
};

export default rootReducer;
