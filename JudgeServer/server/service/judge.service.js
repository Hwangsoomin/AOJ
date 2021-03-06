import fs from 'fs';
import childProcess from 'child_process';
import path from 'path';

import Compiler from '../models/compiler.model.js';
import { PendingModel, ProblemModel, StatusModel } from '../models/judge.model.js';

const execSync = childProcess.execSync;
const dir = path.join(__dirname, '../../test');

const seccomp_rule = async (lang) => {
    if(lang === 'c' || lang === 'cpp') return 'c_cpp';
    else return 'general';
};

export default class JudgeService {
    static run = async () => {
        try {
            const pending = await PendingModel.front();
            if(typeof pending === 'undefined') return;

            Queue.place(async () => {
                let ceStdout;
                try {
                    const judge = await StatusModel.find(pending.number);
                    const problem = await ProblemModel.find(judge.problemNum);

                    const compile = await Compiler.run(judge.code, judge.lang);
                    if (compile.success === false) {
                        ceStdout = compile.stdout;
                        throw new Error('컴파일 에러');
                    }

                    let maxTime = 0, maxMemory = 0;

                    for (let i = 0; i < problem.inputList.length; i++) {
                        const maxProcessNumber = 200;
                        const maxOutputSize = 2097152;
                        const input = problem.inputList[i].txt;
                        const rule = await seccomp_rule(judge.lang);
                        fs.writeFileSync(`${dir}/input.txt`, input, 'utf8');

                        const script = `sudo ${dir}/libjudger.so --max_cpu_time=${problem.timeLimit} --max_real_time=${problem.timeLimit * 5} `
                            + `--max_memory=${problem.memoryLimit} --max_process_number=${maxProcessNumber} --max_output_size=${maxOutputSize} `
                            + `--exe_path=${dir}/test.o --input_path=${dir}/input.txt --output_path=${dir}/output.txt --error_path=${dir}/error.txt `
                            + `--uid=0 --gid=0 --seccomp_rule_name=${rule}`;

                        const stdout = execSync(script).toString();
                        const status = JSON.parse(stdout);

                        if (status.result === 1 || status.result === 2) throw new Error('시간 초과');
                        else if (status.result === 3) throw new Error('메모리 초과');
                        else if (status.result === 4) {
                            if (status.signal === 25) throw new Error('출력 형식이 잘못되었습니다');
                            else throw new Error('런타임 에러');
                        } else if (status.result !== 0) throw new Error('서버 에러');

                        const userOutput = fs.readFileSync(`${dir}/output.txt`, 'utf8').toString();
                        const ansOutput = problem.outputList[i].txt.toString();

                        const userCmp = userOutput.split('\n');
                        const ansCmp = ansOutput.split('\n');

                        while (userCmp.length > 0 && userCmp[userCmp.length - 1].trimEnd() === '') userCmp.pop();
                        while (ansCmp[ansCmp.length - 1].trimEnd() === '') ansCmp.pop();

                        if (userCmp.length !== ansCmp.length) throw new Error('틀렸습니다');
                        for (let j = 0; j < userCmp.length; j++)
                            if (userCmp[j].trimEnd() !== ansCmp[j].trimEnd())
                                throw new Error('틀렸습니다');

                        maxTime = Math.max(maxTime, status.cpu_time);
                        maxMemory = Math.max(maxMemory, status.memory);
                    }
                    await StatusModel.update(pending.number, '맞았습니다', compile.stdout, maxTime, maxMemory);
                    Queue.next();
                } catch (err) {
                    if(err.message === undefined) throw new Error('Stdout is undefined');
                    else if(typeof err.message !== 'string') throw new Error('Type is not String');
                    else if(err.message === '서버 에러') {
                        await StatusModel.update(pending.number, err.message, '', -1, -1);
                        throw new Error('Judge Server error');
                    }
                    else if(err.message === '컴파일 에러')
                        await StatusModel.update(pending.number, err.message, ceStdout, -1, -1);
                    else if(err.message === '런타임 에러' || err.message === '틀렸습니다'
                        || err.message === '시간 초과' || err.message === '메모리 초과' || err.message === '출력 형식이 잘못되었습니다')
                        await StatusModel.update(pending.number, err.message, '', -1, -1);
                    else throw err;
                    Queue.next();
                }
            });
            return await PendingModel.delete(pending.number);
        } catch (err) {
            err.message = 'Service -> ' + err.message;
            throw err;
        }
    }
}