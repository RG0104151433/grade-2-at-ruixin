class Solution {
public:
    int minInsertions(string s) {
        int left=0;
        int ans=0;
        int len=s.size();
        for (int i=0;i<len;i++) {
            if (s[i]=='(') {
                left++;
                continue;
            }
            if (left>0) left--;
            else ans++;
            if (i<len-1 && s[i+1]==')') i++;
            else ans++;
        }
        return ans+left*2;
    }
};
