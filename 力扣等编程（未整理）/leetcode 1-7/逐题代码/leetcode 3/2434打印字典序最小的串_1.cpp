char* robotWithString(char* s) {
    //思路：先进后出的栈，出栈条件为比后续的最小值都要小
    int len=strlen(s);
    char* suf=(char*)malloc((len+1)*sizeof(char));
    suf[len]='z';
    for (int i=len-1;i>=0;i--) suf[i]=suf[i+1]<s[i]?suf[i+1]:s[i];
    char *ans=s,*stack=suf;
    int top=-1,pos=0;
    for (int i=0;i<len;i++) {
        stack[++top]=s[i];
        while (top>=0 && suf[i+1]>=stack[top]) ans[pos++]=stack[top--];
    }
    ans[len]='\0';
    free(suf);
    return ans;
}
