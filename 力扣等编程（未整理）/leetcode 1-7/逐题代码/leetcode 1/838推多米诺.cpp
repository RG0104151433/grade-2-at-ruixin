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

char* pushDominoes(char* s) {
    int n = strlen(s);
    int pre = -1; // 上一个 L 或 R 的位置
    for (int i = 0; i <= n; i++) {
        char ch = i < n ? s[i] : 'R';
        if (ch == '.') {
            continue;
        }
        if (ch == (pre < 0 ? 'L' : s[pre])) { // L...L 或 R...R
            memset(s + pre + 1, ch, i - pre - 1); // 全变成 s[i]
        } else if (ch == 'L') { // R...L
            int half = (i - pre - 1) / 2;
            memset(s + pre + 1, 'R', half); // 前一半变 R
            memset(s + i - half, 'L', half); // 后一半变 L
        }
        pre = i;
    }
    return s;
}
