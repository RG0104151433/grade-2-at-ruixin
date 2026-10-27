//计算一个只有ABC的字符串中包含三种字符的子串数量
class Solution {
public:
    int numberOfSubstrings(string s) {
        int cnt[3]{};
        int left=0,ans=0;
        //枚举右，维护左
        for (char c:s) {
            cnt[c-'a']++;
            while (cnt[0] && cnt[1] && cnt[2]) {
                cnt[s[left]-'a']--;
                left++;
            }
            ans+=left;//意味着对于这个位置，前面left个位置全都符合要求
        }
        return ans;
    }
};
