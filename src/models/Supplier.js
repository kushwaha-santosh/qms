import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema({
  organizationId:{type:mongoose.Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
  supplierCode:{type:String,required:true,trim:true,uppercase:true},
  name:{type:String,required:true,trim:true},
  supplierType:{type:String,trim:true,uppercase:true},
  category:{type:String,trim:true,uppercase:true},
  contactPerson:{type:String,trim:true,default:""},
  email:{type:String,trim:true,lowercase:true,default:""},
  phone:{type:String,trim:true,default:""},
  address:{type:String,trim:true,default:""},
  country:{type:String,trim:true,default:""},
  rating:{type:Number,min:0,max:5,default:null},
  status:{type:String,trim:true,uppercase:true,default:"OPEN"},
  statusComment:{type:String,trim:true,default:""},
  description:{type:String,trim:true,default:""},
  qualificationDate:{type:Date,default:null},
  nextReviewDate:{type:Date,default:null},
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  updatedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
},{timestamps:true,strict:true});
SupplierSchema.index({organizationId:1,supplierCode:1},{unique:true});
export default mongoose.models.Supplier || mongoose.model("Supplier",SupplierSchema);
