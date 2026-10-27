int minLength(char* s) {
    int len=strlen(s),top=-1;
    char* stack=(char*)malloc(len*sizeof(char));
    for (int i=0;i<len;i++) {
        stack[++top]=s[i];
        if (top>0 && (stack[top]=='D' || stack[top]=='B') && stack[top]-stack[top-1]==1) top-=2;
    }
    return top+1;
}
