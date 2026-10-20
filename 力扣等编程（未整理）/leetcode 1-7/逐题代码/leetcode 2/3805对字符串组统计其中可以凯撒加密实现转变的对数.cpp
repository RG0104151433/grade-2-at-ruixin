long long countPairs(char** words, int wordsSize) {
    long long ans[wordsSize],result=0;
    int len=strlen(words[0]);
    for (int i=0;i<wordsSize;i++) {
        ans[i]=0;
    }
    for (int i=0;i<wordsSize;i++) {
        for (int j=i;j>=0;j--) {
            if (j!=i) {
                int dif=words[i][0]-words[j][0];
                for (int k=0;k<len;k++) {
                    if (words[i][k]!=words[j][k]+dif) break;
                    else ans[i]+=ans[j]=1;
                }
            }
        }
    }
    for (int i=0;i<wordsSize;i++) result+=ans[i];
    return result;
}
