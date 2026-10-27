char* clearStars(char* s) {
    int len=strlen(s),low=26,total=0,t=0;//low表示已有的最小字符，total表示处理后的总长度
    int** mem=(int**)calloc(26,sizeof(int*));//用于计数每个字母出现的位置
    int hash[26];//用于记录每个字母出现的次数
    for (int i=0;i<26;i++) hash[i]=-1;
    for (int i=0;i<26;i++) mem[i]=(int*)calloc(len,sizeof(int));
    for (int i=0;i<len;i++) {
        if (islower(s[i])) {//是字母的，记录出现位置，次数加一，验证最小值
            mem[s[i]-'a'][++hash[s[i]-'a']]=i;
            low=s[i]-'a'<low?s[i]-'a':low;
        }
        else {//在不越界的情况下减一，必须及时更新low
            if (low!=26 && hash[low]>=0) {
                hash[low]--;
                if (low<26 && hash[low]==-1) {
                    while (low<26 && hash[low]==-1) low++;//
                }
            }         
        }
    }
    for (int i=0;i<26;i++) total+=hash[i]+1;//记录总长度
    char* result=(char*)malloc((total+1)*sizeof(char));
    char* mock=(char*)calloc(len,sizeof(char));
    for (int i=0;i<26;i++) {
        if (hash[i]>=0) {
            for (int j=0;j<=hash[i];j++) mock[mem[i][j]]='a'+i;
        }
    }
    for (int i=0;i<len;i++) {
        if (islower(mock[i]) || mock[i]=='*') result[t++]=mock[i];
    }
    result[total]='\0';
    for (int i=0;i<26;i++) free(mem[i]);
    free(mem);
    free(mock);
    return result;
}
