// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 2 份。

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
