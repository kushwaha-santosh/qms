import api from "./axios";
export const getReports=async(params={})=>{const r=await api.get("/reports",{params});return r?.data||{};};
export default {getReports};
