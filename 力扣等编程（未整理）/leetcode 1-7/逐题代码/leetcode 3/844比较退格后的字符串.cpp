bool backspaceCompare(char* s, char* t) {
    int cnts=-1,cntt=-1;
    int lens=strlen(s),lent=strlen(t);
    for (int i=0;i<lens;i++) {
        if (islower(s[i])) s[++cnts]=s[i];
        else cnts-=cnts>-1;//第一位处的#不会退格
    }
    for (int i=0;i<lent;i++) {
        if (islower(t[i])) t[++cntt]=t[i];
        else cntt-=cntt>-1;
    }
    if (cnts>-1) s[cnts+1]='\0';
    if (cntt>-1) t[cntt+1]='\0';//处理最后一位比较好，但是也要注意条件
    if (cnts!=cntt) return false;
    else if (cnts==-1) return true;
    return strncmp(s,t,cntt+1)==0;//strncmp返回值是int。且应该+1比较
}
//strcpy要求第一个是char*，如果直接使用会出现错误
