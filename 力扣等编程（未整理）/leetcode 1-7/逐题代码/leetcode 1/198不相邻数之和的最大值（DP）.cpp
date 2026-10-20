bool wordBreak(char* s, char** wordDict, int wordDictSize) {
    int left=0,len=strlen(s);
    for (int right=0;right<len;right++) {
        char temp[right-left+1];
        strncpy(temp,s+left,right-left+1);
        for (int j=0;j<wordDictSize;j++) {
            if (strcmp(wordDict[j],temp)==0) {
                if (right==len-1) return true;
                else {
                    left=right+1;
                }
            }
            else {
                if (right==len-1) return false;
            }
        }
    }
    return false;
}
