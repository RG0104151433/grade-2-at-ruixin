bool wordBreak(char* s, char** wordDict, int wordDictSize) {
    int* len=malloc(sizeof(int)*wordDictSize);
    for (int i=0;i<wordDictSize;i++) {
        len[i]=strlen(wordDict[i]);
    }
    bool* ans=malloc(sizeof(int)*strlen(s));
    for (int i=0;s[i];i++) {//对于字符串s中的每一个字母
        ans[i]=false;
        for (int j=0;j<wordDictSize;j++) {
            if (i+1<len[j]) continue;
            else if (i+1==len[j] || ans[i-len[j]]==true) {
                char temp[len[j]];
                strncpy(temp,s+i-len[j]+1,len[j]);
                if (strcmp(temp, wordDict[j])==0) ans[i]=true;
            }
            else continue;
        }
    }
    bool result=ans[wordDictSize-1];
    free(len);
    free(ans);
    return result;
}
