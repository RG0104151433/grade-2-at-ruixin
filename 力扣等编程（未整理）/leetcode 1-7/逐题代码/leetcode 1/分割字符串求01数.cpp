int maxScore(char* s) {
    int ans=0,i,len=strlen(s);
    for (i=1;i<len;i++) {
        int temp=0;
        for (int j=0;j<len;j++) {
            if (s[j]=='0' && j<i) temp++;
            if (s[j]=='1' && j>=i) temp++;
        }
        if (temp>ans) ans=temp;
    }
    return ans;
}
int maxScore(char* s) {
    int n0=0,n1=0,i,ans=0;
    for (i=0;s[i];i++) {
        if (s[i]=='0') n0++;
        if (s[i]=='1') n1++;
    }
    int temp=n1,n=n0+n1-1;
    for (i=0;i<n;i++) {
        if (i==0 && s[i]=='1') temp--;
        else if (i==0 && s[i]=='0') temp++;
        else if (i!=0 && s[i]=='0') temp++;
        else if (i!=0 && s[i]=='1') temp--;
        if (temp>ans) ans=temp;
    }
    return ans;
}
