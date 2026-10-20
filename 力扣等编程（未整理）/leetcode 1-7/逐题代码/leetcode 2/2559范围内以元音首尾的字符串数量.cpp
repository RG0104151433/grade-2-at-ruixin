/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* vowelStrings(char** words, int wordsSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
    int cnt[wordsSize+1];
    cnt[0]=0;//转化为前缀之差
    for (int i=1;i<=wordsSize;i++) {
        int len=strlen(words[i-1]);
        cnt[i]=cnt[i-1];
        if ((words[i-1][0]=='a' || words[i-1][0]=='e' || words[i-1][0]=='i' || words[i-1][0]=='o' || words[i-1][0]=='u') && (words[i-1][len-1]=='a' || words[i-1][len-1]=='e' || words[i-1][len-1]=='i' || words[i-1][len-1]=='o' || words[i-1][len-1]=='u')) cnt[i]++;
    }
    int* result=(int*)malloc(queriesSize*sizeof(int));
    for (int i=0;i<queriesSize;i++) {//注意是哪个size
        result[i]=cnt[queries[i][1]+1]-cnt[queries[i][0]];
    }
    *returnSize=queriesSize;
    return result;
}
