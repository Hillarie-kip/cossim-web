const initialState = {
  layoutstyledata: typeof window !== "undefined" && window.localStorage
    ? localStorage.getItem("layoutStyling")
    : null,
};

export default initialState;
