//给你一个字符串 s。
//英文字母中每个字母的 镜像 定义为反转字母表之后对应位置上的字母。例如，'a' 的镜像是 'z'，'y' 的镜像是 'b'。
//最初，字符串 s 中的所有字符都 未标记 。字符串 s 的初始分数为 0 ，你需要对其执行以下过程：
//从左到右遍历字符串。对于每个下标 i ，找到距离最近的 未标记 下标 j，下标 j 需要满足 j < i 且 s[j] 是 s[i] 的镜像。然后 标记 下标 i 和 j，总分加上 i - j 的值。
//如果对于下标 i，不存在满足条件的下标 j，则跳过该下标，继续处理下一个下标，不需要进行标记。
//返回最终的总分。
class Solution {
public:
    long long calculateScore(string s) {
        stack<int> stk[26];
        long long ans(0);
        for (int i=0;i<s.size();i++) {
            int c=s[i]-'a';
            if (!stk[25-c].empty()) {
                ans+=i-stk[25-c].top();
                stk[25-c].pop();
            }
            else stk[c].push(i);
        } 
        return ans;
    }
};
