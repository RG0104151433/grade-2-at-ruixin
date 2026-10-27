//给你一个字符串 s，「k 倍重复项删除操作」将会从 s 中选择 k 个相邻且相等的字母，并删除它们，使被删去的字符串的左侧和右侧连在一起。
//你需要对 s 重复进行无限次这样的删除操作，直到无法继续为止。在执行完所有删除操作后，返回最终得到的字符串。本题答案保证唯一。
class Solution {
public:
    string removeDuplicates(string s, int k) {
        stack<int> cnt;//只定义关于相同数字数量的栈，直接在原字符串上操作
        for (int i=0;s[i];i++) {
            if (i==0 || s[i]!=s[i-1]) cnt.push(1);//开始计数一段新的连续相同数字
            else if (++cnt.top()==k) {//将增加计数操作与判断结合
                cnt.pop();
                s.erase(i-k+1,k);//又是不认识的stl函数
                i-=k;//s总量减少了k，计数的i就要减少k
            }
        }
        return s;
    }
};
