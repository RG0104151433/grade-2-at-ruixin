class Solution {
public:
    bool parseBoolExpr(string expression) {
        vector<char> stk;//用于记录除逗号外的字符
        vector<char> op;//用于记录操作符
        int len=expression.size();
        for (int i=0;i<=len;i++) {
            if (i<len && expression[i]==',') continue;//跳过逗号
            else if (i<len && (expression[i]=='!' || expression[i]=='|' || expression[i]=='&')) op.push_back(expression[i]);//记录操作符，注意操作符不压入stk
            else if (i==len && !op.empty() || expression[i]==')') {
                char oprt=op.back();
                op.pop_back();
                switch (oprt) {
                    case '!': {
                        char back=stk.back();
                        while (!stk.empty() && stk.back()!='(') stk.pop_back();
                        stk.pop_back();
                        stk.push_back(back=='t'?'f':'t');
                    } break;
                    case '|': {
                        int flag=0;
                        while (!stk.empty() && stk.back()!='(') {
                            char back=stk.back();
                            stk.pop_back();
                            if (back=='t') flag=1;
                        }
                        stk.pop_back();
                        stk.push_back(flag==0?'f':'t');//用flag确定新压入的字符
                    } break;
                    case '&': {
                        int flag=1;
                        while (!stk.empty() && stk.back()!='(') {
                            char back=stk.back();
                            stk.pop_back();//依旧要全部弹出
                            if (back=='f') flag=0;
                        }
                        stk.pop_back();//注意把最后一个左括号弹出
                        stk.push_back(flag==1?'t':'f');
                    } break;
                }
            }
            else if (i<len) stk.push_back(expression[i]);//注意对长度len进行保护！
        }
        return stk.back()=='f'?false:true;
    }
};
//对表达式从左向右进行阅读
//对除了逗号以外的操作符进行压栈
//如果遇到右括号就反向计数，将所有元素录入vector并读取操作
//分操作类型得到结果而后压栈，注意需要将原本的所有内容出栈，同时避免穿透括号的需要
