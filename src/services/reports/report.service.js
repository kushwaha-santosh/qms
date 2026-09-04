import mongoose from "mongoose";
import NCR from "@/models/NCR.js";
import CAPA from "@/models/CAPA.js";
import Audit from "@/models/Audit.js";
import Document from "@/models/Document.js";
import Training from "@/models/Training.js";
import Supplier from "@/models/Supplier.js";

const oid=(v)=>v&&mongoose.Types.ObjectId.isValid(v)?new mongoose.Types.ObjectId(v):null;
const scope=(user)=>user?.role==="SUPER_ADMIN"?{}:{organizationId:oid(user?.organizationId?._id||user?.organizationId)};
const cleanDate=(value,fallback)=>{const d=value?new Date(value):fallback;return Number.isNaN(d?.getTime?.())?fallback:d;};
const group=async(Model,match,field,limit=8)=>Model.aggregate([{ $match:match },{ $group:{_id:{$ifNull:[`$${field}`,"UNSPECIFIED"]},count:{$sum:1}}},{ $sort:{count:-1}},{ $limit:limit}]);
const status=async(Model,match)=>group(Model,match,"status",12);

export async function getReports({user,from,to}={}){
  const now=new Date(); const defaultFrom=new Date(Date.UTC(now.getUTCFullYear()-1,now.getUTCMonth(),1));
  const start=cleanDate(from,defaultFrom), end=cleanDate(to,new Date()); end.setHours(23,59,59,999);
  const base=scope(user), range={createdAt:{$gte:start,$lte:end}};
  const [ncr,capa,audits,documents,training,suppliers,ncrStatus,capaStatus,auditStatus,documentStatus,trainingStatus,supplierStatus,ncrCategory,ncrSeverity,ncrDepartment,capaDepartment,auditType,documentType,trainingType,supplierCategory] = await Promise.all([
    NCR.countDocuments({...base,...range}),CAPA.countDocuments({...base,...range}),Audit.countDocuments({...base,...range}),Document.countDocuments({...base,...range}),Training.countDocuments({...base,...range}),Supplier.countDocuments({...base,...range}),
    status(NCR,{...base,...range}),status(CAPA,{...base,...range}),status(Audit,{...base,...range}),status(Document,{...base,...range}),status(Training,{...base,...range}),status(Supplier,{...base,...range}),
    group(NCR,{...base,...range},"category"),group(NCR,{...base,...range},"severity"),group(NCR,{...base,...range},"department"),group(CAPA,{...base,...range},"department"),group(Audit,{...base,...range},"auditType"),group(Document,{...base,...range},"documentType"),group(Training,{...base,...range},"trainingType"),group(Supplier,{...base,...range},"category"),
  ]);
  const pack=(rows)=>rows.map(x=>({name:String(x._id).replaceAll("_"," "),value:x.count}));
  return {period:{from:start.toISOString(),to:end.toISOString()},summary:{ncr,capa,audits,documents,training,suppliers},breakdowns:{ncrStatus:pack(ncrStatus),capaStatus:pack(capaStatus),auditStatus:pack(auditStatus),documentStatus:pack(documentStatus),trainingStatus:pack(trainingStatus),supplierStatus:pack(supplierStatus),ncrCategory:pack(ncrCategory),ncrSeverity:pack(ncrSeverity),ncrDepartment:pack(ncrDepartment),capaDepartment:pack(capaDepartment),auditType:pack(auditType),documentType:pack(documentType),trainingType:pack(trainingType),supplierCategory:pack(supplierCategory)}};
}
