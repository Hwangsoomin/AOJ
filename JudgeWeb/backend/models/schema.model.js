import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
    number: {
        type: Number,
        required: true,
        unique: true
    },
    title: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    timeLimit: {
        type: Number,
        required: true
    },
    memoryLimit: {
        type: Number,
        required: true
    },
    inputList: [
        {
            _id: Number,
            txt: String
        },
    ],
    outputList: [
        {
            _id: Number,
            txt: String
        }
    ],
});

const statusSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['채점 중', '맞았습니다', '틀렸습니다', '시간 초과', '메모리 초과', '런타임 에러', '출력 형식이 잘못되었습니다', '컴파일 에러', '서버 에러'],
        default : '채점 중'
    },
    message: {
        type: String,
        default : ''
    },
    number: {
        type: Number,
        required : true,
        unique: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    code: {
        type: String,
    },
    lang: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    problemNum: {
        type : Number,
        required: true
    },
    time: Number,
    memory: Number
});

const pendingSchema = new mongoose.Schema({
    number : {
        type : Number,
        required : true
    }
});

const contestSchema = new mongoose.Schema({
    number : {
        type : Number,
        required : true,
        unique : true
    },
    problemNum : [ Number ],
    userList : [ String ],
    start : {
        type : Date,
        required : true
    },
    end : {
        type : Date,
        required : true
    }
});

const ProblemSchema = new mongoose.model('ProblemSchema', problemSchema);
const StatusSchema = new mongoose.model('StatusSchema', statusSchema);
const PendingSchema = new mongoose.model('PendingSchema', pendingSchema);
const ContestSchema = new mongoose.model('ContestSchema', contestSchema);

export {
    ProblemSchema,
    StatusSchema,
    PendingSchema,
    ContestSchema
};