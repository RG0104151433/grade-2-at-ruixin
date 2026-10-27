char* longestCommonPrefix(char** strs, int strsSize) {
    char *s0=strs[0];
    for (int i=0;s0[i];i++) {
        for (int j=0;j<strsSize;j++) {
            if (strs[j][i]!=s0[i]) {
                s0[i]='\0';
                return s0;
            }
        }
    }
    return s0;
}
