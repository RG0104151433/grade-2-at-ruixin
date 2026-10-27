int findTheLongestSubstring(char* s) {
    int len=strlen(s),result=0;
    int cal[len+1][5],cnt[len+1],fin[32];
    for (int i=0;i<32;i++) fin[i]=i==0?0:-1;
    for (int i=0;i<=len;i++) for (int j=0;j<5;j++) cal[i][j]=0,cnt[i]=0;
    for (int i=1;i<=len;i++) {
        for (int j=0;j<5;j++) cal[i][j]=cal[i-1][j];//注意要先继承在操作
        if (s[i-1]=='a') cal[i][0]=(cal[i][0]+1)%2;//注意是i还是i-1
        else if (s[i-1]=='e') cal[i][1]=(cal[i][1]+1)%2;
        else if (s[i-1]=='i') cal[i][2]=(cal[i][2]+1)%2;
        else if (s[i-1]=='o') cal[i][3]=(cal[i][3]+1)%2;
        else if (s[i-1]=='u') cal[i][4]=(cal[i][4]+1)%2;
    }
    for (int i=0;i<=len;i++) {
        for (int j=0;j<5;j++) cnt[i]+=cal[i][j]*pow(2,j);
        if (fin[cnt[i]]==-1) fin[cnt[i]]=i;//注意0是一个合法的位置，则有可能更新后再次修改，故使用-1
        else result=i-fin[cnt[i]]>result?i-fin[cnt[i]]:result;
    }
    return result;
}
