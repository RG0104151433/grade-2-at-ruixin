class Solution {
public:
    string reverseWords(string s) {
        reverse(s.begin(),s.end());
        int l=s.size(),idx=0;
        for (int start=0;start<l;start++) {
            if (s[start]!=' ') {//在这里不计数，同时后面通过idx向前修改s截断前面的空格
                if (idx) s[idx++]=' ';//人为添加空格。原本的空格通过向前修改去掉
                int end=start;
                while (end<l && s[end]!=' ') s[idx++]=s[end++];
                reverse(s.begin()+idx-(end-start),s.begin()+idx);//通过两次reverse，先换词间顺序，再调正反
                start=end;
            }
        }
        s.resize(idx);//通过向后截断删去原本的头部空格
        return s;
    }
};
