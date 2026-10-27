// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 1 份。

char* pushDominoes(char* dominoes) {
    int left=0,right=0,len=strlen(dominoes),dot=0;
    for (int i=0;i<len;i++) {
        dot+=dominoes[i]=='.'?0:1;
    }
    if (dot==0 || dot==len) return dominoes;
    while (left<len) {
        while (dominoes[left]!='.' && left+1<len) left++;
        right=left;
        while (right+1<len && dominoes[right+1]=='.') right++;
        if (right<len-1 && left==0 && dominoes[right+1]=='L') {
            for (int i=right;i>=0;i--) dominoes[i]='L';
        }
        else if (left>0 && right==len-1 && dominoes[left-1]=='R') {
            for (int i=left;i<len;i++) dominoes[i]='R';
        }
        else if (left>0 && right<len-1 && dominoes[left-1]==dominoes[right+1]) {
            for (int i=left;i<=right;i++) dominoes[i]=dominoes[left-1];
        }
        else if (left>0 && right<len-1 && dominoes[left-1]=='R' && dominoes[right+1]=='L') {
            for (int i=left,j=right;i<j;i++,j--) {
                dominoes[i]=dominoes[left-1];
                dominoes[j]=dominoes[right+1];
            }
        }
        left=right+1;
    }
    return dominoes;
}
