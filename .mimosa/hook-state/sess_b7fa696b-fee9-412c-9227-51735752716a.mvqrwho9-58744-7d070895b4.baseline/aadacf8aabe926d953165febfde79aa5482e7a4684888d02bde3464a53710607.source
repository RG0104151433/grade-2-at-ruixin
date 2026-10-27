int maxVowels(char* s, int k) {
    int ans=0,len=strlen(s);
    for (int i=0;i<k;i++) {
        if (s[i]=='a' || s[i]=='e' || s[i]=='i' || s[i]=='o' || s[i]=='u') ans++;
    }
    int temp=ans;//注意变量位置，确保能够及时更新，如果定义在循环内则一直保持原ans值，没有实时变化窗口内的数量
    for (int i=0;i<len-k;i++) {
        if (s[i]=='a' || s[i]=='e' || s[i]=='i' || s[i]=='o' || s[i]=='u') temp--;
        if (s[i+k]=='a' || s[i+k]=='e' || s[i+k]=='i' || s[i+k]=='o' || s[i+k]=='u') temp++;
        if (temp>ans) ans=temp;
    }
    return ans;
}
