// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 1 份。

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
