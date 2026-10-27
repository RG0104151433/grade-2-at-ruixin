int longestSemiRepetitiveSubstring(char* s) {
    int n=0,len=strlen(s), left=0,ans=0;
    if (len==1) return 1;
    for (int right=0;right<len-1;right++) {
        if (s[right]==s[right+1]) {
            n++;
        }
        if (n>1) {
            while (s[left]!=s[left+1]) {
                left++;
            }
            left++;
            n--;
        }
        ans=right-left+2>ans?right-left+2:ans;
    }
    return ans;
}
