import mongoose from "mongoose";

const TrainingSchema = new mongoose.Schema({
  organizationId:{type:mongoose.Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
  trainingNumber:{type:String,required:true,trim:true,uppercase:true},
  title:{type:String,required:true,trim:true},
  trainingType:{type:String,trim:true,uppercase:true},
  department:{type:String,trim:true,uppercase:true},
  trainer:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
  participants:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
  scheduledDate:{type:Date,default:null},
  completionDate:{type:Date,default:null},
  dueDate:{type:Date,default:null},
  status:{type:String,trim:true,uppercase:true,default:"OPEN"},
  statusComment:{type:String,trim:true,default:""},
  description:{type:String,trim:true,default:""},
  remarks:{type:String,trim:true,default:""},
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  updatedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
},{timestamps:true,strict:true});
TrainingSchema.index({organizationId:1,trainingNumber:1},{unique:true});
export default mongoose.models.Training || mongoose.model("Training",TrainingSchema);
