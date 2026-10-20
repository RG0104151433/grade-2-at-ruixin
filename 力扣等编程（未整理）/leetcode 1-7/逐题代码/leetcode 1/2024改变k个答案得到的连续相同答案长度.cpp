int maxConsecutiveAnswers(char* answerKey, int k) {
    int ans=0, left=0, len=strlen(answerKey), sum=0;
    for (int right=0; right<len; right++) {
        sum+=answerKey[right]=='T'?1:0;
        while (sum>k) {
            sum-=answerKey[left]=='T'?1:0;
            left++;
        }
        ans=right-left+1>ans?right-left+1:ans;
    }
    sum=0;
    left=0;
    for (int right=0; right<len; right++) {
        sum+=answerKey[right]=='F'?1:0;
        while (sum>k) {
            sum-= (answerKey[left]=='F'?1:0);
            left++;
        }
        ans=right-left+1>ans?right-left+1:ans;
    }
    return ans;
}
